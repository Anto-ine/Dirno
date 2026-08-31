# DIRNO — Guide de l'agent

Vérification des transports exceptionnels.
Cette fiche s'adresse à la personne qui utilise l'application au quotidien.

---

## Ouvrir l'application

**Double-cliquer sur l'icône `DIRNO` du Bureau.**

Le navigateur s'ouvre tout seul sur l'application. Le tout premier démarrage
demande une trentaine de secondes ; les suivants sont immédiats.

Se connecter avec l'adresse et le mot de passe remis par l'administrateur.
La connexion reste valable **12 heures** : au-delà, l'application redemande
le mot de passe.

> L'application ne fonctionne que sur ce poste. Elle n'est accessible depuis
> aucun autre ordinateur du réseau.

---

## Vérifier un convoi

### Étape 1 — Charger les bases de référence

Deux zones en haut de l'écran : **Ouvrages d'Art** et **Réseau / Restrictions**.
Glisser le fichier `.ods` (ou `.xlsx`) dessus, ou cliquer pour le choisir.

> **À retenir : ces bases ne sont pas conservées d'une session à l'autre.**
> Il faut les recharger **à chaque ouverture de l'application**. C'est le seul
> geste à ne pas oublier.
>
> Sans la base **Ouvrages d'Art**, la vérification fonctionne quand même, mais
> le résultat porte la mention orange *« Base non chargée — importer la base ODS
> pour vérifier les ouvrages »* : les ponts et passages du trajet n'ont alors
> **pas** été contrôlés.

Garder les fichiers à un endroit fixe et facile d'accès (par exemple un dossier
`Bases DIRNO` sur le Bureau) fait gagner du temps chaque matin.

### Étape 2 — Saisir le convoi et l'itinéraire

- **Catégorie** (1, 2 ou 3) : elle détermine les limites appliquées.
- **Masse, largeur, hauteur, longueur** : obligatoires.
- **Charge à l'essieu** et **vitesse** : facultatives.
- **Tronçons** : au moins une route (A13, N13, …) avec ses PR de début et de fin.

Saisir les décimales **avec un point** : `4.75`, pas `4,75`.

Si un champ obligatoire manque, l'application refuse de lancer la vérification
et l'indique par un message. Elle ne valide jamais un convoi incomplet.

### Étape 3 — Lire le résultat

| Couleur | Signification | Conduite à tenir |
|---|---|---|
| 🟢 **Vert** | Conforme | Le convoi respecte les limites. |
| 🟠 **Orange** | Sous réserve | Proche d'une limite, ou un point n'a pas pu être contrôlé. **À examiner avant décision.** |
| 🔴 **Rouge** | Non conforme | Une limite réglementaire est dépassée. Le détail indique laquelle. |

Chaque ligne du tableau donne la valeur saisie, la limite applicable et le motif.

---

## Limites appliquées

| Critère | Catégorie 1 | Catégorie 2 | Catégorie 3 |
|---|---|---|---|
| Masse totale | 48 t | 72 t | 120 t |
| Largeur hors tout | 3,00 m | 4,00 m | 5,00 m |
| Longueur totale | 30 m | 35 m | 45 m |

| Critère | Limite (toutes catégories) |
|---|---|
| Hauteur | 4,75 m — avertissement au-delà de 4,30 m |
| Charge à l'essieu | 13 t |

Un avertissement orange se déclenche aussi lorsque la masse atteint 90 % de la
limite de sa catégorie.

---

## Conserver une trace

### Enregistrer un résultat en PDF

Cliquer sur **📄 Exporter PDF**. La fenêtre d'impression de Windows s'ouvre :
dans la liste **Imprimante**, choisir **« Microsoft Print to PDF »**
(ou *« Enregistrer au format PDF »*), puis **Imprimer** et choisir où ranger le
fichier.

> C'est bien la fenêtre d'impression qui s'ouvre : c'est normal. La mise en page
> est prévue pour cela — l'en-tête, les boutons et les menus n'apparaissent pas
> sur le document.

### Retrouver les vérifications passées

L'onglet **Historique** conserve les **50 dernières** vérifications, avec le
détail de chaque contrôle. Elles peuvent y être exportées en PDF ou supprimées.

Chaque vérification est enregistrée automatiquement : rien à faire pour cela.

---

## En cas de problème

| Situation | Que faire |
|---|---|
| « Trop de tentatives. Réessayez dans 15 minute(s). » | 5 mots de passe erronés se sont succédé. Attendre 15 minutes, ou demander à l'administrateur de lever le blocage. |
| L'application redemande le mot de passe | La session de 12 h a expiré. Se reconnecter simplement. |
| Le navigateur affiche une page blanche ou une erreur | Fermer le navigateur, puis rouvrir l'icône **DIRNO** du Bureau. |
| Le résultat indique « Base non chargée » | La base Ouvrages d'Art n'a pas été rechargée : la reglisser à l'étape 1. |
| Mot de passe oublié | Seul l'administrateur peut le réinitialiser. |

**Ne pas déplacer ni renommer le dossier DIRNO**, sinon le raccourci du Bureau
ne fonctionne plus.

---

## Fermer l'application

Fermer la fenêtre du navigateur. Rien d'autre n'est nécessaire.

---

*Pour l'installation, la sauvegarde et l'administration des comptes :
voir `INSTALLATION.md`.*
