# Requirements Document - Amélioration de la Navigation URL

## Introduction

Le système actuel de navigation vers la page des résultats passe toutes les données du pitch dans l'URL via des paramètres de requête, créant des URLs extrêmement longues et peu pratiques. Cette fonctionnalité doit être améliorée pour offrir une meilleure expérience utilisateur et une architecture plus robuste.

## Requirements

### Requirement 1 - URLs Propres et Lisibles

**User Story:** En tant qu'utilisateur, je veux des URLs courtes et lisibles pour pouvoir facilement partager mes pitches et naviguer dans l'application.

#### Acceptance Criteria

1. WHEN un pitch est généré THEN l'URL de résultat SHALL contenir un identifiant unique court (ex: `/results/abc123`)
2. WHEN un utilisateur partage une URL de pitch THEN elle SHALL être lisible et professionnelle
3. WHEN un utilisateur accède à une URL de pitch THEN les données SHALL se charger correctement
4. IF l'URL contient un identifiant invalide THEN le système SHALL afficher une page d'erreur appropriée

### Requirement 2 - Encodage et Compression des Données URL

**User Story:** En tant que développeur, je veux encoder et compresser les données de pitch dans l'URL pour créer des liens partageables sans infrastructure serveur complexe.

#### Acceptance Criteria

1. WHEN un pitch est généré THEN les données SHALL être compressées et encodées en base64
2. WHEN les données sont encodées THEN l'URL résultante SHALL être significativement plus courte
3. WHEN l'URL est partagée THEN elle SHALL contenir toutes les informations nécessaires
4. IF les données compressées dépassent les limites d'URL THEN un fallback vers stockage temporaire SHALL être utilisé

### Requirement 3 - Fallback et Compatibilité

**User Story:** En tant qu'utilisateur existant, je veux que mes anciens liens continuent de fonctionner pendant la transition.

#### Acceptance Criteria

1. WHEN une ancienne URL avec données dans les paramètres est accédée THEN elle SHALL continuer de fonctionner
2. WHEN une ancienne URL est détectée THEN elle SHALL être automatiquement convertie vers le nouveau format
3. WHEN la conversion échoue THEN un message d'erreur approprié SHALL être affiché
4. IF possible THEN l'utilisateur SHALL être redirigé vers la nouvelle URL propre

### Requirement 4 - Performance et Sécurité

**User Story:** En tant qu'utilisateur, je veux que l'application soit rapide et sécurisée lors du partage de pitches.

#### Acceptance Criteria

1. WHEN des données sensibles sont dans un pitch THEN elles SHALL NOT être exposées dans l'URL
2. WHEN un pitch est partagé THEN seul l'identifiant public SHALL être visible
3. WHEN les données sont stockées temporairement THEN elles SHALL avoir une durée de vie limitée (ex: 24h)
4. WHEN un utilisateur accède à un pitch expiré THEN il SHALL recevoir un message informatif

### Requirement 5 - Gestion d'État Côté Client

**User Story:** En tant qu'utilisateur, je veux que mes données de pitch soient préservées pendant ma session de navigation.

#### Acceptance Criteria

1. WHEN je navigue entre les pages THEN mes données de pitch SHALL être préservées
2. WHEN je rafraîchis la page THEN les données SHALL se recharger correctement
3. WHEN ma session expire THEN je SHALL être informé et redirigé appropriément
4. IF je ferme et rouvre l'onglet THEN les données récentes SHALL être disponibles (si non expirées)