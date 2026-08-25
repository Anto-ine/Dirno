<?php

namespace App\Controller;

use App\Config\Limites;
use App\Entity\Convoi;
use App\Entity\Troncon;
use App\Entity\Utilisateur;
use App\Service\JournalAudit;
use App\Service\LimiteurConnexion;
use App\Service\TokenService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use App\Entity\VerificationDetail;

#[Route('/api')]
class ApiController extends AbstractController
{
    public function __construct(
        private readonly TokenService $tokenService,
        private readonly LimiteurConnexion $limiteur,
        private readonly JournalAudit $audit,
    ) {
    }

    // ===== CONFIG (limites + réseau, pour synchroniser le front) =====
    #[Route('/config', name: 'api_config', methods: ['GET'])]
    public function config(): JsonResponse
    {
        return $this->json([
            'limites' => Limites::PAR_CATEGORIE,
            'routes'  => Limites::ROUTES,
            'hauteur' => ['max' => Limites::HAUTEUR_MAX, 'warn' => Limites::HAUTEUR_WARN],
            'essieu'  => ['max' => Limites::ESSIEU_MAX],
        ]);
    }

    // ===== LOGIN =====
    #[Route('/login', name: 'api_login', methods: ['POST'])]
    public function login(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data  = json_decode($request->getContent(), true) ?? [];
        $email = strtolower(trim((string)($data['email'] ?? '')));
        $mdp   = (string)($data['motDePasse'] ?? '');

        if ($email === '' || $mdp === '') {
            return $this->json(['erreur' => 'Email et mot de passe requis'], 401);
        }

        $cle = $email . '|' . $request->getClientIp();

        if (($attente = $this->limiteur->secondesAvantReessai($cle)) > 0) {
            $this->audit->enregistrer('connexion_bloquee', $email, ['ip' => $request->getClientIp()]);

            return $this->json([
                'erreur' => 'Trop de tentatives. Réessayez dans '.ceil($attente / 60).' minute(s).',
            ], 429);
        }

        $user = $em->getRepository(Utilisateur::class)->findOneBy(['email' => $email, 'actif' => true]);

        if (!$user || !password_verify($mdp, $user->getMotDePasse())) {
            $this->limiteur->enregistrerEchec($cle);
            $this->audit->enregistrer('connexion_echec', $email, ['ip' => $request->getClientIp()]);

            // Message volontairement identique que le compte existe ou non,
            // pour ne pas révéler quelles adresses sont enregistrées.
            return $this->json(['erreur' => 'Email ou mot de passe incorrect'], 401);
        }

        $this->limiteur->reinitialiser($cle);
        $this->audit->enregistrer('connexion_reussie', $email, ['ip' => $request->getClientIp()]);

        $token = $this->tokenService->creer($user);

        return $this->json([
            'token' => $token,
            'utilisateur' => [
                'id'    => $user->getId(),
                'nom'   => $user->getNom(),
                'email' => $user->getEmail(),
                'role'  => $user->getRole(),
            ]
        ]);
    }

    // ===== VÉRIFIER CONVOI =====
    #[Route('/verifier', name: 'api_verifier', methods: ['POST'])]
    public function verifier(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // Vérification token
        $user = $this->getUserFromToken($request, $em);
        if (!$user) {
            return $this->json(['erreur' => 'Non autorisé'], 401);
        }

        $cat  = (string)($data['categorie'] ?? '');
        $m    = (float)($data['masse'] ?? 0);
        $es   = isset($data['essieu']) && $data['essieu'] !== '' ? (float)$data['essieu'] : null;
        $l    = (float)($data['largeur'] ?? 0);
        $h    = (float)($data['hauteur'] ?? 0);
        $lo   = (float)($data['longueur'] ?? 0);
        $v    = isset($data['vitesse']) && $data['vitesse'] !== '' ? (float)$data['vitesse'] : null;

        if (!in_array($cat, Limites::CATEGORIES, true)) {
            return $this->json(['erreur' => 'Catégorie de convoi invalide'], 400);
        }

        try {
            $date = !empty($data['datePassage']) ? new \DateTime($data['datePassage']) : null;
        } catch (\Exception) {
            return $this->json(['erreur' => 'Date de passage invalide'], 400);
        }

        $checks = [];
        $statut = 'pass';


        $push = function($critere, $valeur, $limite, $tag, $detail) use (&$checks, &$statut) {
            $checks[] = compact('critere', 'valeur', 'limite', 'tag', 'detail');
            if ($tag === 'ko') $statut = 'fail';
            elseif ($tag === 'warning' && $statut !== 'fail') $statut = 'warning';
        };

        $lm = Limites::pour('masse', $cat);
        if ($m > $lm)                            $push('Masse totale', $m.' t', $lm.' t', 'ko', 'Dépasse la limite de '.$lm.' t');
        elseif ($m > $lm * Limites::RATIO_WARN)  $push('Masse totale', $m.' t', $lm.' t', 'warning', 'Proche de la limite réglementaire');
        else                                     $push('Masse totale', $m.' t', $lm.' t', 'ok', 'Conforme');

        $ll = Limites::pour('largeur', $cat);
        if ($l > $ll) $push('Largeur hors tout', $l.' m', $ll.' m', 'ko', 'Dépasse la limite de '.$ll.' m');
        else          $push('Largeur hors tout', $l.' m', $ll.' m', 'ok', 'Conforme');

        $hmax = Limites::HAUTEUR_MAX;
        if ($h > $hmax)                   $push('Hauteur', $h.' m', '4,75 m', 'ko', 'Dépasse le gabarit maximal');
        elseif ($h > Limites::HAUTEUR_WARN) $push('Hauteur', $h.' m', '4,75 m', 'warning', 'Vérifier les ouvrages sur le trajet');
        else                              $push('Hauteur', $h.' m', '4,75 m', 'ok', 'Conforme');

        $llon = Limites::pour('longueur', $cat);
        if ($lo > $llon) $push('Longueur totale', $lo.' m', $llon.' m', 'ko', 'Dépasse la limite de '.$llon.' m');
        else             $push('Longueur totale', $lo.' m', $llon.' m', 'ok', 'Conforme');

        if ($es !== null) {
            $emax = Limites::ESSIEU_MAX;
            if ($es > $emax) $push('Charge essieu', $es.' t', $emax.' t', 'ko', 'Dépasse la charge essieu maximale');
            else             $push('Charge essieu', $es.' t', $emax.' t', 'ok', 'Conforme');
        }

        // Contrôles d'ouvrages d'art : calculés par le front à partir de la base ODS
        // qu'il est seul à charger. Sans cette reprise, le statut enregistré ne
        // correspondrait pas à celui affiché à l'agent.
        foreach ($data['ouvrageChecks'] ?? [] as $oc) {
            if (!is_array($oc) || empty($oc['critere'])) continue;
            $tag = in_array($oc['tag'] ?? '', ['ok', 'warning', 'ko'], true) ? $oc['tag'] : 'warning';
            $push(
                mb_substr((string)$oc['critere'], 0, 100),
                mb_substr((string)($oc['valeur'] ?? ''), 0, 50),
                mb_substr((string)($oc['limite'] ?? ''), 0, 50),
                $tag,
                mb_substr((string)($oc['detail'] ?? ''), 0, 255),
            );
        }

      // Sauvegarde
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

        $troncons = $data['troncons'] ?? [];
        foreach ($troncons as $t) {
            if (empty($t['route'])) continue;
            if (!Limites::routeExiste($t['route'])) {
                return $this->json(['erreur' => 'Itinéraire inconnu : '.$t['route']], 400);
            }
            $troncon = new Troncon();
            $troncon->setRoute(strtoupper(trim($t['route'])))
                    ->setPrDebut($t['prDebut'] ?? null)
                    ->setPrFin($t['prFin'] ?? null)
                    ->setSens($t['sens'] ?? null)
                    ->setConvoi($convoi);
            $convoi->addTroncon($troncon);
            $em->persist($troncon);
        }

        // Sauvegarde des détails de vérification
        foreach ($checks as $check) {
            $detail = new VerificationDetail();
            $detail->setCritere($check['critere'])
                   ->setValeur($check['valeur'])
                   ->setLimite($check['limite'])
                   ->setTag($check['tag'])
                   ->setDetail($check['detail']);
            $convoi->addDetail($detail);
            $em->persist($detail);
        }

        $em->persist($convoi);
        $em->flush();

        return $this->json([
            'statut'  => $statut,
            'checks'  => $checks,
            'convoi'  => ['id' => $convoi->getId()],
        ]);
    }

    // ===== HISTORIQUE =====
    #[Route('/historique', name: 'api_historique', methods: ['GET'])]
    public function historique(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUserFromToken($request, $em);
        if (!$user) {
            return $this->json(['erreur' => 'Non autorisé'], 401);
        }

        $convois = $em->getRepository(Convoi::class)->findBy([], ['createdAt' => 'DESC'], 50);

       $result = array_map(function($c) use ($em) {
            $details = $em->getRepository(VerificationDetail::class)->findBy(['convoi' => $c]);
            return [
                'id'          => $c->getId(),
                'categorie'   => $c->getCategorie(),
                'masse'       => $c->getMasse(),
                'largeur'     => $c->getLargeur(),
                'hauteur'     => $c->getHauteur(),
                'statut'      => $c->getStatut(),
                'createdAt'   => $c->getCreatedAt()->format('d/m/Y H:i'),
                'datePassage' => $c->getDatePassage()?->format('d/m/Y'),
                'troncons'    => array_map(fn($t) => [
                    'route'   => $t->getRoute(),
                    'prDebut' => $t->getPrDebut(),
                    'prFin'   => $t->getPrFin(),
                ], $c->getTroncons()->toArray()),
                'checks' => array_map(fn($d) => [
                    'critere' => $d->getCritere(),
                    'valeur'  => $d->getValeur(),
                    'limite'  => $d->getLimite(),
                    'tag'     => $d->getTag(),
                    'detail'  => $d->getDetail(),
                ], $details),
            ];
        }, $convois);

        return $this->json($result);
    }


// ===== SUPPRIMER CONVOI =====
#[Route('/convois/{id}', name: 'api_supprimer_convoi', methods: ['DELETE'])]
public function supprimerConvoi(int $id, Request $request, EntityManagerInterface $em): JsonResponse
{
    $user = $this->getUserFromToken($request, $em);
    if (!$user) {
        return $this->json(['erreur' => 'Non autorisé'], 401);
    }

    $convoi = $em->getRepository(Convoi::class)->find($id);
    if (!$convoi) {
        return $this->json(['erreur' => 'Convoi introuvable'], 404);
    }

    $em->remove($convoi);
    $em->flush();

    $this->audit->enregistrer('convoi_supprime', $user->getEmail(), ['convoi' => $id]);

    return $this->json(['message' => 'Vérification supprimée']);
}


    // ===== ADMIN : LISTE UTILISATEURS =====
    #[Route('/admin/utilisateurs', name: 'api_admin_utilisateurs', methods: ['GET'])]
    public function listeUtilisateurs(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUserFromToken($request, $em);
        if (!$user || $user->getRole() !== 'admin') {
            return $this->json(['erreur' => 'Accès refusé'], 403);
        }

        $users = $em->getRepository(Utilisateur::class)->findAll();
        return $this->json(array_map(fn($u) => [
            'id'        => $u->getId(),
            'nom'       => $u->getNom(),
            'email'     => $u->getEmail(),
            'role'      => $u->getRole(),
            'actif'     => $u->isActif(),
            'createdAt' => $u->getCreatedAt()->format('d/m/Y'),
        ], $users));
    }

    // ===== ADMIN : CRÉER UTILISATEUR =====
    #[Route('/admin/utilisateurs', name: 'api_admin_creer_utilisateur', methods: ['POST'])]
    public function creerUtilisateur(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUserFromToken($request, $em);
        if (!$user || $user->getRole() !== 'admin') {
            return $this->json(['erreur' => 'Accès refusé'], 403);
        }

        $data  = json_decode($request->getContent(), true) ?? [];
        $nom   = trim((string)($data['nom'] ?? ''));
        $email = strtolower(trim((string)($data['email'] ?? '')));
        $mdp   = (string)($data['motDePasse'] ?? '');
        $role  = $data['role'] ?? 'agent';

        if ($nom === '') {
            return $this->json(['erreur' => 'Le nom est obligatoire'], 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['erreur' => 'Adresse email invalide'], 400);
        }
        if (strlen($mdp) < 8) {
            return $this->json(['erreur' => 'Le mot de passe doit faire au moins 8 caractères'], 400);
        }
        if (!in_array($role, ['agent', 'admin'], true)) {
            return $this->json(['erreur' => 'Rôle invalide'], 400);
        }
        if ($em->getRepository(Utilisateur::class)->findOneBy(['email' => $email])) {
            return $this->json(['erreur' => 'Cette adresse email est déjà utilisée'], 409);
        }

        $u = new Utilisateur();
        $u->setNom($nom)
          ->setEmail($email)
          ->setMotDePasse(password_hash($mdp, PASSWORD_BCRYPT))
          ->setRole($role)
          ->setActif(true);

        $em->persist($u);
        $em->flush();

        $this->audit->enregistrer('utilisateur_cree', $user->getEmail(), ['cible' => $email, 'role' => $role]);

        return $this->json(['message' => 'Utilisateur créé', 'id' => $u->getId()], 201);
    }

    // ===== ADMIN : ACTIVER/DÉSACTIVER =====
    #[Route('/admin/utilisateurs/{id}/toggle', name: 'api_admin_toggle', methods: ['PUT'])]
    public function toggleUtilisateur(int $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUserFromToken($request, $em);
        if (!$user || $user->getRole() !== 'admin') {
            return $this->json(['erreur' => 'Accès refusé'], 403);
        }

        $u = $em->getRepository(Utilisateur::class)->find($id);
        if (!$u) return $this->json(['erreur' => 'Utilisateur introuvable'], 404);

        // Se désactiver soi-même reviendrait à se verrouiller dehors.
        if ($u->getId() === $user->getId()) {
            return $this->json(['erreur' => 'Impossible de désactiver votre propre compte'], 400);
        }

        $u->setActif(!$u->isActif());
        $em->flush();

        $this->audit->enregistrer(
            $u->isActif() ? 'utilisateur_active' : 'utilisateur_desactive',
            $user->getEmail(),
            ['cible' => $u->getEmail()],
        );

        return $this->json(['message' => 'Statut mis à jour', 'actif' => $u->isActif()]);
    }
    // ===== ADMIN : SUPPRIMER UTILISATEUR =====
#[Route('/admin/utilisateurs/{id}', name: 'api_admin_supprimer', methods: ['DELETE'])]
public function supprimerUtilisateur(int $id, Request $request, EntityManagerInterface $em): JsonResponse
{
    $user = $this->getUserFromToken($request, $em);
    if (!$user || $user->getRole() !== 'admin') {
        return $this->json(['erreur' => 'Accès refusé'], 403);
    }

    $u = $em->getRepository(Utilisateur::class)->find($id);
    if (!$u) return $this->json(['erreur' => 'Utilisateur introuvable'], 404);

    // Empêcher de supprimer son propre compte
    if ($u->getId() === $user->getId()) {
        return $this->json(['erreur' => 'Impossible de supprimer votre propre compte'], 400);
    }

    $cible = $u->getEmail();

    $em->remove($u);
    $em->flush();

    $this->audit->enregistrer('utilisateur_supprime', $user->getEmail(), ['cible' => $cible]);

    return $this->json(['message' => 'Utilisateur supprimé']);
}

    // ===== HELPER : TOKEN =====
    private function getUserFromToken(Request $request, EntityManagerInterface $em): ?Utilisateur
    {
        $auth = $request->headers->get('Authorization', '');
        if (!str_starts_with($auth, 'Bearer ')) return null;

        $payload = $this->tokenService->verifier(substr($auth, 7));
        if ($payload === null) return null;

        $user = $em->getRepository(Utilisateur::class)->find($payload['id']);

        // Un compte désactivé ou renommé depuis l'émission du jeton perd l'accès
        // immédiatement, sans attendre l'expiration.
        if (!$user || !$user->isActif() || $user->getEmail() !== $payload['email']) {
            return null;
        }

        return $user;
    }
}