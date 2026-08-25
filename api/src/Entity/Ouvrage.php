<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'ouvrage')]
class Ouvrage
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 10)]
    private string $voie;

    #[ORM\Column(type: 'float')]
    private float $pr;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $abscisse = null;

    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    private ?string $district = null;

    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    private ?string $cei = null;

    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    private ?string $identifiant = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $nom = null;

    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    private ?string $typeOuvrage = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $longueur = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $nombreTravees = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $largeurUtile = null;

    #[ORM\Column(type: 'string', length: 10, nullable: true)]
    private ?string $noteIqoa = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $anneeNoteIqoa = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $anneeConstruction = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $chargeMilitaire = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $autresConvois = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $carteTe = null;



    // TODO: ajouter des méthodes de calcul ou de validation si nécessaire.


    public function getId(): ?int { return $this->id; }
    public function getVoie(): string { return $this->voie; }
    public function setVoie(string $v): self { $this->voie = $v; return $this; }
    public function getPr(): float { return $this->pr; }
    public function setPr(float $p): self { $this->pr = $p; return $this; }
    public function getAbscisse(): ?float { return $this->abscisse; }
    public function setAbscisse(?float $a): self { $this->abscisse = $a; return $this; }
    public function getDistrict(): ?string { return $this->district; }
    public function setDistrict(?string $d): self { $this->district = $d; return $this; }
    public function getCei(): ?string { return $this->cei; }
    public function setCei(?string $c): self { $this->cei = $c; return $this; }
    public function getIdentifiant(): ?string { return $this->identifiant; }
    public function setIdentifiant(?string $i): self { $this->identifiant = $i; return $this; }
    public function getNom(): ?string { return $this->nom; }
    public function setNom(?string $n): self { $this->nom = $n; return $this; }
    public function getTypeOuvrage(): ?string { return $this->typeOuvrage; }
    public function setTypeOuvrage(?string $t): self { $this->typeOuvrage = $t; return $this; }
    public function getLongueur(): ?float { return $this->longueur; }
    public function setLongueur(?float $l): self { $this->longueur = $l; return $this; }
    public function getNombreTravees(): ?int { return $this->nombreTravees; }
    public function setNombreTravees(?int $n): self { $this->nombreTravees = $n; return $this; }
    public function getLargeurUtile(): ?float { return $this->largeurUtile; }
    public function setLargeurUtile(?float $l): self { $this->largeurUtile = $l; return $this; }
    public function getNoteIqoa(): ?string { return $this->noteIqoa; }
    public function setNoteIqoa(?string $n): self { $this->noteIqoa = $n; return $this; }
    public function getAnneeNoteIqoa(): ?int { return $this->anneeNoteIqoa; }
    public function setAnneeNoteIqoa(?int $a): self { $this->anneeNoteIqoa = $a; return $this; }
    public function getAnneeConstruction(): ?int { return $this->anneeConstruction; }
    public function setAnneeConstruction(?int $a): self { $this->anneeConstruction = $a; return $this; }
    public function getChargeMilitaire(): ?float { return $this->chargeMilitaire; }
    public function setChargeMilitaire(?float $c): self { $this->chargeMilitaire = $c; return $this; }
    public function getAutresConvois(): ?float { return $this->autresConvois; }
    public function setAutresConvois(?float $a): self { $this->autresConvois = $a; return $this; }
    public function getCarteTe(): ?float { return $this->carteTe; }
    public function setCarteTe(?float $c): self { $this->carteTe = $c; return $this; }
    public function __toString(): string
    {
        return $this->nom ?? ($this->identifiant ?? 'Ouvrage #' . $this->id);
    }
    
}

