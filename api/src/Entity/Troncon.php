<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'troncon')]
class Troncon
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 10)]
    private string $route;

    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    private ?string $prDebut = null;

    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    private ?string $prFin = null;

    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    private ?string $sens = null;

    #[ORM\ManyToOne(targetEntity: Convoi::class, inversedBy: 'troncons')]
    #[ORM\JoinColumn(nullable: false)]
    private Convoi $convoi;

    public function getId(): ?int { return $this->id; }

    public function getRoute(): string { return $this->route; }
    
    public function setRoute(string $r): self { $this->route = $r; return $this; }

    public function getPrDebut(): ?string { return $this->prDebut; }
    public function setPrDebut(?string $p): self { $this->prDebut = $p; return $this; }

    public function getPrFin(): ?string { return $this->prFin; }

    public function setPrFin(?string $p): self { $this->prFin = $p; return $this; }
    public function getSens(): ?string { return $this->sens; }
    public function setSens(?string $s): self { $this->sens = $s; return $this; }

    

    public function getConvoi(): Convoi { return $this->convoi; }
    public function setConvoi(Convoi $c): self { $this->convoi = $c; return $this; }
}