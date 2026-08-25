<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'verification_detail')]
class VerificationDetail
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Convoi::class, inversedBy: 'details')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Convoi $convoi;

    #[ORM\Column(type: 'string', length: 100)]
    private string $critere;

    #[ORM\Column(type: 'string', length: 50)]
    private string $valeur;

    #[ORM\Column(type: 'string', length: 50)]
    private string $limite;

    #[ORM\Column(type: 'string', length: 10)]
    private string $tag;

    #[ORM\Column(type: 'string', length: 255)]
    private string $detail;

    public function getId(): ?int { return $this->id; }
    public function getConvoi(): Convoi { return $this->convoi; }
    public function setConvoi(Convoi $c): self { $this->convoi = $c; return $this; }
    public function getCritere(): string { return $this->critere; }
    public function setCritere(string $c): self { $this->critere = $c; return $this; }
    public function getValeur(): string { return $this->valeur; }
    public function setValeur(string $v): self { $this->valeur = $v; return $this; }
    public function getLimite(): string { return $this->limite; }
    public function setLimite(string $l): self { $this->limite = $l; return $this; }
    public function getTag(): string { return $this->tag; }
    public function setTag(string $t): self { $this->tag = $t; return $this; }
    public function getDetail(): string { return $this->detail; }
    public function setDetail(string $d): self { $this->detail = $d; return $this; }
}