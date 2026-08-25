<?php

namespace App\Controller;

use App\Config\Limites;
use App\Entity\Convoi;
use App\Entity\Troncon;
use App\Entity\Ouvrage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;


class ConvoiController extends AbstractController
{
    // Limites et réseau proviennent de App\Config\Limites (source unique).
    private const LIMITES = Limites::PAR_CATEGORIE;

    #[Route('/', name: 'convoi_index')]
    public function index(): Response
    {
        return $this->render('convoi/index.html.twig', [
            'routes' => Limites::ROUTES,
        ]);
    }

    #[Route('/verifier', name: 'convoi_verifier', methods: ['POST'])]
    public function verifier(Request $request, EntityManagerInterface $em): Response
    {
        $data = $request->request->all();
        $cat  = $data['categorie'] ?? '';
        $m    = (float)($data['masse'] ?? 0);
        $es   = isset($data['essieu']) && $data['essieu'] !== '' ? (float)$data['essieu'] : null;
        $l    = (float)($data['largeur'] ?? 0);
        $h    = (float)($data['hauteur'] ?? 0);
        $lo   = (float)($data['longueur'] ?? 0);
        $v    = isset($data['vitesse']) && $data['vitesse'] !== '' ? (float)$data['vitesse'] : null;
        $date = !empty($data['datePassage']) ? new \DateTime($data['datePassage']) : null;

        // Vérification des critères
        $checks = [];
        $statut = 'pass';

        $push = function($critere, $valeur, $limite, $tag, $detail) use (&$checks, &$statut) {
            $checks[] = compact('critere', 'valeur', 'limite', 'tag', 'detail');
            if ($tag === 'ko') $statut = 'fail';
            elseif ($tag === 'warning' && $statut !== 'fail') $statut = 'warning';
        };

        // Masse
        $lm = self::LIMITES['masse'][$cat];
        if ($m > $lm)           $push('Masse totale', $m.' t', $lm.' t', 'ko', 'Dépasse la limite de '.$lm.' t');
        elseif ($m > $lm * 0.9) $push('Masse totale', $m.' t', $lm.' t', 'warning', 'Proche de la limite réglementaire');
        else                     $push('Masse totale', $m.' t', $lm.' t', 'ok', 'Conforme');

        // Largeur
        $ll = self::LIMITES['largeur'][$cat];
        if ($l > $ll) $push('Largeur hors tout', $l.' m', $ll.' m', 'ko', 'Dépasse la limite de '.$ll.' m');
        else          $push('Largeur hors tout', $l.' m', $ll.' m', 'ok', 'Conforme');

        // Hauteur
        if ($h > 4.75)       $push('Hauteur', $h.' m', '4,75 m', 'ko', 'Dépasse le gabarit maximal');
        elseif ($h > 4.30)   $push('Hauteur', $h.' m', '4,75 m', 'warning', 'Vérifier les ouvrages sur le trajet'); 
        else                  $push('Hauteur', $h.' m', '4,75 m', 'ok', 'Conforme');

        // Longueur
        $llon = self::LIMITES['longueur'][$cat];
        if ($lo > $llon) $push('Longueur totale', $lo.' m', $llon.' m', 'ko', 'Dépasse la limite de '.$llon.' m');
        else             $push('Longueur totale', $lo.' m', $llon.' m', 'ok', 'Conforme');

        // Essieu
        if ($es !== null) {
            if ($es > 13) $push('Charge essieu', $es.' t', '13 t', 'ko', 'Dépasse la charge essieu maximale');
            else          $push('Charge essieu', $es.' t', '13 t', 'ok', 'Conforme');
            
        }

        // Vérification des ouvrages sur l'itinéraire
        $troncons = $data['troncons'] ?? [];
        $ouvragesProblematiques = [];

        foreach ($troncons as $t) {
            if (empty($t['route'])) continue;

            $prDebut = isset($t['prDebut']) && $t['prDebut'] !== '' ? (float)$t['prDebut'] : null;
            $prFin   = isset($t['prFin'])   && $t['prFin']   !== '' ? (float)$t['prFin']   : null;

            $qb = $em->createQueryBuilder()
                ->select('o')
                ->from(Ouvrage::class, 'o')
                ->where('o.voie = :voie')
                ->setParameter('voie', $t['route']);

            if ($prDebut !== null && $prFin !== null) {
                $qb->andWhere('o.pr BETWEEN :debut AND :fin')
                   ->setParameter('debut', min($prDebut, $prFin))
                   ->setParameter('fin',   max($prDebut, $prFin));
            }

            $ouvrages = $qb->getQuery()->getResult();

            foreach ($ouvrages as $ouvrage) {
                $limite = $ouvrage->getAutresConvois();
                if ($limite !== null && $m > $limite) {
                    $ouvragesProblematiques[] = $ouvrage;
                    $push(
                        'Ouvrage : ' . ($ouvrage->getNom() ?? $ouvrage->getIdentifiant()),
                        $m.' t',
                        $limite.' t',
                        'ko',
                        'Masse dépasse la limite de cet ouvrage (PR '.$ouvrage->getPr().')'
                    );
                } elseif ($limite !== null && $m > $limite * 0.9) {
                    $push(
                        'Ouvrage : ' . ($ouvrage->getNom() ?? $ouvrage->getIdentifiant()),
                        $m.' t',
                        $limite.' t',
                        'warning',
                        'Proche de la limite de cet ouvrage (PR '.$ouvrage->getPr().')'
                    );
                }
            }
        }

        if (empty($ouvragesProblematiques)) {
            $push('Ouvrages d\'art', 'Vérifiés', '—', 'ok', 'Aucun ouvrage limitant sur l\'itinéraire');
        }

        // Sauvegarde en BDD
        $convoi = new Convoi();
        $convoi->setCategorie($cat)
               ->setMasse($m)
               ->setEssieu($es)
               ->setLargeur($l)
               ->setHauteur($h)
               ->setLongueur($lo)
               ->setVitesse($v)
               ->setDatePassage($date)
               ->setStatut($statut);
               
               

        foreach ($troncons as $t) {
            if (empty($t['route'])) continue;
            $troncon = new Troncon();
            $troncon->setRoute($t['route'])
                    ->setPrDebut($t['prDebut'] ?? null)
                    ->setPrFin($t['prFin'] ?? null)
                    ->setSens($t['sens'] ?? null)
                    ->setConvoi($convoi);
            $convoi->addTroncon($troncon);
            $em->persist($troncon);
        }

        $em->persist($convoi);
        $em->flush();

        return $this->render('convoi/resultat.html.twig', [
            'convoi' => $convoi,
            'checks' => $checks,
            'statut' => $statut,
        ]);
    }

    #[Route('/historique', name: 'convoi_historique')]
    public function historique(EntityManagerInterface $em): Response
    {
        $convois = $em->getRepository(Convoi::class)->findBy([], ['createdAt' => 'DESC']);

        return $this->render('convoi/historique.html.twig', [
            'convois' => $convois,
        ]);
    }
}