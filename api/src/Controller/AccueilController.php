<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Renvoie la racine vers l'application.
 *
 * Le lanceur ouvre directement /app/, mais un agent qui saisit l'adresse à la
 * main ou conserve un favori sur « / » doit arriver au même endroit plutôt que
 * sur une page d'erreur.
 */
class AccueilController extends AbstractController
{
    #[Route('/', name: 'accueil', methods: ['GET'])]
    public function index(): RedirectResponse
    {
        return $this->redirect('/app/');
    }
}
