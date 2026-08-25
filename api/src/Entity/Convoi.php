<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity]
#[ORM\Table(name: 'convoi')]
class Convoi
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 1)]
    private string $categorie;

    #[ORM\Column(type: 'float')]
    private float $masse;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $essieu = null;

    #[ORM\Column(type: 'float')]
    private float $largeur;

    #[ORM\Column(type: 'float')]
    private float $hauteur;

    #[ORM\Column(type: 'float')]
    private float $longueur;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $vitesse = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $datePassage = null;

    #[ORM\Column(type: 'string', length: 10)]
    private string $statut = 'pass';

    #[ORM\Column(type: 'datetime')]
    private \DateTimeInterface $createdAt;

    #[ORM\OneToMany(mappedBy: 'convoi', targetEntity: Troncon::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $troncons;

    /**
     * Cascade au niveau ORM : SQLite n'applique pas les ON DELETE CASCADE tant que
     * PRAGMA foreign_keys est désactivé (son défaut), ce qui laissait des détails
     * orphelins à chaque suppression de convoi.
     */
    #[ORM\OneToMany(mappedBy: 'convoi', targetEntity: VerificationDetail::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $details;

    public function __construct()
    {
        $this->troncons = new ArrayCollection();
        $this->details = new ArrayCollection();
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }
    public function getCategorie(): string { return $this->categorie; }
    public function setCategorie(string $c): self { $this->categorie = $c; return $this; }

    public function getMasse(): float { return $this->masse; }
    public function setMasse(float $m): self { $this->masse = $m; return $this; }

    public function getEssieu(): ?float { return $this->essieu; }
    public function setEssieu(?float $e): self { $this->essieu = $e; return $this; }

    public function getLargeur(): float { return $this->largeur; }
    public function setLargeur(float $l): self { $this->largeur = $l; return $this; }

    public function getHauteur(): float { return $this->hauteur; }
    public function setHauteur(float $h): self { $this->hauteur = $h; return $this; }

    public function getLongueur(): float { return $this->longueur; }
    public function setLongueur(float $l): self { $this->longueur = $l; return $this; }
    public function getVitesse(): ?float { return $this->vitesse; }
    public function setVitesse(?float $v): self { $this->vitesse = $v; return $this; }

    

    public function getDatePassage(): ?\DateTimeInterface { return $this->datePassage; }
    public function setDatePassage(?\DateTimeInterface $d): self { $this->datePassage = $d; return $this; }

    public function getStatut(): string { return $this->statut; }
    public function setStatut(string $s): self { $this->statut = $s; return $this; }

    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }

    public function getTroncons(): Collection { return $this->troncons; }

    public function addTroncon(Troncon $t): self {
        if (!$this->troncons->contains($t)) {
            $this->troncons[] = $t;
            $t->setConvoi($this);
        }
        return $this;
    }

    public function getDetails(): Collection { return $this->details; }

    public function addDetail(VerificationDetail $d): self {
        if (!$this->details->contains($d)) {
            $this->details[] = $d;
            $d->setConvoi($this);
        }
        return $this;
    }
}