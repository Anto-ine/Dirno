<?php

namespace App\Service;

use App\Entity\Utilisateur;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Émission et vérification des jetons d'authentification.
 *
 * Format : base64url(payload) . '.' . base64url(HMAC-SHA256(payload, secret))
 * où payload = "id:email:expiration".
 *
 * La signature empêche la fabrication d'un jeton arbitraire : sans le secret
 * applicatif, modifier l'identifiant ou le rôle invalide le jeton.
 */
class TokenService
{
    /** Durée de validité d'un jeton (12 h, soit une vacation de service). */
    private const DUREE_VALIDITE = 43200;

    public function __construct(
        #[Autowire('%env(APP_SECRET)%')]
        private readonly string $secret,
    ) {
    }

    public function creer(Utilisateur $user): string
    {
        $payload = sprintf('%d:%s:%d', $user->getId(), $user->getEmail(), time() + self::DUREE_VALIDITE);

        return $this->encode($payload) . '.' . $this->encode($this->signer($payload));
    }

    /**
     * Retourne le payload décodé si le jeton est authentique et non expiré,
     * null sinon. Ne fait aucun accès base : c'est à l'appelant de recharger
     * l'utilisateur et de vérifier qu'il est toujours actif.
     *
     * @return array{id: int, email: string}|null
     */
    public function verifier(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 2) {
            return null;
        }

        $payload   = $this->decode($parts[0]);
        $signature = $this->decode($parts[1]);
        if ($payload === '' || $signature === '') {
            return null;
        }

        // hash_equals : comparaison à temps constant, contre les attaques temporelles.
        if (!hash_equals($this->signer($payload), $signature)) {
            return null;
        }

        $champs = explode(':', $payload);
        if (count($champs) !== 3) {
            return null;
        }

        [$id, $email, $expiration] = $champs;
        if ((int) $expiration < time()) {
            return null;
        }

        return ['id' => (int) $id, 'email' => $email];
    }

    private function signer(string $payload): string
    {
        return hash_hmac('sha256', $payload, $this->secret, true);
    }

    private function encode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function decode(string $data): string
    {
        $decoded = base64_decode(strtr($data, '-_', '+/'), true);

        return $decoded === false ? '' : $decoded;
    }
}
