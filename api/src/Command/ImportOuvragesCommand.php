<?php

namespace App\Command;

use App\Entity\Ouvrage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:import-ouvrages',
    description: 'Importe les ouvrages d\'art depuis un fichier ODS/CSV',
)]
class ImportOuvragesCommand extends Command
{
    public function __construct(private EntityManagerInterface $em)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('fichier', InputArgument::REQUIRED, 'Chemin vers le fichier CSV');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $fichier = $input->getArgument('fichier');

        if (!file_exists($fichier)) {
            $io->error('Fichier introuvable : ' . $fichier);
            return Command::FAILURE;
        }

        $handle = fopen($fichier, 'r');
        $header = fgetcsv($handle, 0, ';');
        $count  = 0;

        while (($row = fgetcsv($handle, 0, ';')) !== false) {
            if (empty($row[0]) || $row[0] === 'Voie') continue;

            $o = new Ouvrage();
            $o->setVoie($row[0] ?? '');
            $o->setPr((float)($row[1] ?? 0));
            $o->setAbscisse(isset($row[2]) && $row[2] !== '' ? (float)$row[2] : null);
            $o->setDistrict($row[3] ?? null);
            $o->setCei($row[4] ?? null);
            $o->setIdentifiant($row[5] ?? null);
            $o->setNom($row[6] ?? null);
            $o->setTypeOuvrage($row[7] ?? null);
            $o->setLongueur(isset($row[8]) && $row[8] !== '' ? (float)$row[8] : null);
            $o->setNombreTravees(isset($row[9]) && $row[9] !== '' ? (int)$row[9] : null);
            $o->setLargeurUtile(isset($row[10]) && $row[10] !== '' ? (float)$row[10] : null);
            $o->setNoteIqoa($row[11] ?? null);
            $o->setAnneeNoteIqoa(isset($row[12]) && $row[12] !== '' ? (int)$row[12] : null);
            $o->setAnneeConstruction(isset($row[13]) && $row[13] !== '' ? (int)$row[13] : null);
            $o->setChargeMilitaire(isset($row[17]) && $row[17] !== '' ? (float)$row[17] : null);
            $o->setAutresConvois(isset($row[18]) && $row[18] !== '' ? (float)$row[18] : null);
            $o->setCarteTe(isset($row[19]) && $row[19] !== '' ? (float)$row[19] : null);

            $this->em->persist($o);
            $count++;

            if ($count % 100 === 0) {
                $this->em->flush();
                $io->writeln("$count ouvrages importés...");
            }
        }

        $this->em->flush();
        fclose($handle);

        $io->success("$count ouvrages importés avec succès !");
        return Command::SUCCESS;
    }
}