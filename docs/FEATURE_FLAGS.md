# Feature Flags Documentation

## Vue d'ensemble

Le système de feature flags permet un déploiement progressif des améliorations du générateur de pitch avec des mécanismes de fallback automatiques et de monitoring en temps réel.

## Architecture

### Composants principaux

1. **Feature Flag Manager** (`src/lib/feature-flags.ts`)
   - Gestion centralisée des flags
   - Configuration par environnement
   - Rollout progressif par pourcentage
   - Monitoring automatique des performances

2. **React Hooks** (`src/hooks/use-feature-flags.ts`)
   - Intégration React pour les composants
   - Hooks pour validation conditionnelle
   - HOC pour wrapping de composants

3. **Monitoring System** (`src/lib/feature-flag-monitoring.ts`)
   - Collecte de métriques en temps réel
   - Détection automatique de régressions
   - Alertes basées sur des seuils

4. **Wrapper Component** (`src/components/forms/pitch-generator-wrapper.tsx`)
   - Point d'entrée principal
   - Fallback automatique vers le système legacy
   - Gestion d'erreurs avec Error Boundary

## Flags disponibles

### ENHANCED_ERROR_HANDLING
- **Description**: Système de gestion d'erreurs amélioré avec classification
- **Fallback**: Système legacy de gestion d'erreurs
- **Monitoring**: Seuil d'erreur 5%, performance 2000ms

### INTELLIGENT_RETRY
- **Description**: Système de retry intelligent avec backoff exponentiel
- **Dépendances**: ENHANCED_ERROR_HANDLING
- **Fallback**: Pas de retry automatique
- **Monitoring**: Seuil d'erreur 10%, performance 5000ms

### REQUEST_CANCELLATION
- **Description**: Annulation de requêtes avec nettoyage gracieux
- **Fallback**: Désactivé (pas d'annulation possible)
- **Monitoring**: Seuil d'erreur 2%, performance 1000ms

### REAL_TIME_VALIDATION
- **Description**: Validation en temps réel avec suggestions
- **Fallback**: Validation basique uniquement
- **Monitoring**: Seuil d'erreur 3%, performance 500ms

### USER_PREFERENCES
- **Description**: Persistance des préférences et historique
- **Fallback**: Pas de sauvegarde des préférences
- **Monitoring**: Seuil d'erreur 1%, performance 200ms

### PITCH_PREVIEW
- **Description**: Aperçu du pitch avant redirection finale
- **Fallback**: Redirection directe vers les résultats
- **Monitoring**: Seuil d'erreur 5%, performance 1500ms

### PERFORMANCE_OPTIMIZATIONS
- **Description**: Optimisations (debouncing, memoization, lazy loading)
- **Fallback**: Comportement standard sans optimisations
- **Monitoring**: Seuil d'erreur 2%, performance 100ms

### FULL_ENHANCED_SYSTEM
- **Description**: Système complet avec toutes les améliorations
- **Dépendances**: Tous les autres flags
- **Fallback**: Système legacy complet
- **Monitoring**: Seuil d'erreur 3%, performance 3000ms

## Utilisation

### Configuration de base

```typescript
import { initializeFeatureFlags, isFeatureEnabled, FEATURE_FLAGS } from '@/lib/feature-flags'

// Initialisation
initializeFeatureFlags({
  userId: 'user123',
  environment: 'production'
})

// Vérification d'un flag
if (isFeatureEnabled(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING)) {
  // Utiliser le système amélioré
} else {
  // Utiliser le système legacy
}
```

### Dans les composants React

```typescript
import { useFeatureFlag, useConditionalFeature } from '@/hooks/use-feature-flags'

function MyComponent() {
  const { enabled, recordMetric } = useFeatureFlag(FEATURE_FLAGS.REAL_TIME_VALIDATION)
  
  const renderValidation = useConditionalFeature(
    FEATURE_FLAGS.REAL_TIME_VALIDATION,
    () => <EnhancedValidation />,
    () => <BasicValidation />
  )
  
  return (
    <div>
      {renderValidation.renderComponent()}
    </div>
  )
}
```

### Monitoring et métriques

```typescript
import { recordMonitoringEvent, useFeatureFlagMonitoring } from '@/lib/feature-flag-monitoring'

function MyComponent() {
  const { recordEvent, getMetrics } = useFeatureFlagMonitoring(FEATURE_FLAGS.PITCH_PREVIEW)
  
  const handleAction = async () => {
    try {
      await someAsyncOperation()
      recordEvent('success')
    } catch (error) {
      recordEvent('error', { error: error.message })
    }
  }
  
  return <button onClick={handleAction}>Action</button>
}
```

## Stratégies de déploiement

### Phase 1: Déploiement canary (10%)
```typescript
// Configuration pour 10% des utilisateurs
const config = {
  flags: {
    [FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]: {
      enabled: true,
      rolloutPercentage: 10,
      monitoring: { enabled: true, errorThreshold: 3 }
    }
  }
}
```

### Phase 2: Déploiement progressif (50%)
```typescript
// Augmentation à 50% après validation
const config = {
  flags: {
    [FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]: {
      enabled: true,
      rolloutPercentage: 50,
      monitoring: { enabled: true, errorThreshold: 5 }
    }
  }
}
```

### Phase 3: Déploiement complet (100%)
```typescript
// Déploiement complet après validation
const config = {
  flags: {
    [FEATURE_FLAGS.ENHANCED_ERROR_HANDLING]: {
      enabled: true,
      rolloutPercentage: 100,
      monitoring: { enabled: true, errorThreshold: 5 }
    }
  }
}
```

## Monitoring et alertes

### Métriques collectées
- **Taux d'erreur**: Pourcentage d'échecs par flag
- **Temps de réponse**: Latence moyenne des opérations
- **Utilisation**: Nombre d'utilisations par flag
- **Taux de succès**: Pourcentage de réussites

### Seuils d'alerte
- **Critique**: Taux d'erreur > 10% ou temps de réponse > 5000ms
- **Élevé**: Taux d'erreur > 5% ou temps de réponse > 2000ms
- **Moyen**: Taux d'erreur > 2% ou temps de réponse > 1000ms

### Actions automatiques
- **Désactivation automatique**: Si les seuils critiques sont atteints
- **Fallback**: Retour automatique au système legacy
- **Alertes**: Notifications aux développeurs

## Debugging et développement

### Outils de développement
```javascript
// Dans la console du navigateur (développement uniquement)
window.featureFlags.enableFeature('enhanced_error_handling')
window.featureFlags.disableFeature('real_time_validation')
window.featureFlags.clearOverrides()
window.featureFlags.getMetrics()

// Monitoring
window.featureFlagMonitoring.getAllMetrics()
window.featureFlagMonitoring.exportData()
```

### Variables d'environnement
```bash
# .env.local
FEATURE_FLAGS_ENVIRONMENT=development
FEATURE_FLAGS_DEFAULT_ENABLED=true
FEATURE_FLAGS_MONITORING_ENABLED=true
```

## Gestion des erreurs

### Stratégies de fallback

1. **Legacy**: Retour au système précédent
   ```typescript
   fallbackBehavior: 'legacy'
   ```

2. **Disabled**: Désactivation de la fonctionnalité
   ```typescript
   fallbackBehavior: 'disabled'
   ```

3. **Error**: Lancement d'une erreur
   ```typescript
   fallbackBehavior: 'error'
   ```

### Error Boundary
Le système utilise un Error Boundary pour capturer les erreurs et basculer automatiquement vers le mode legacy.

```typescript
<ErrorBoundary
  fallback={<LegacyComponent />}
  onError={(error) => recordMonitoringEvent(flagKey, 'error', { error })}
>
  <EnhancedComponent />
</ErrorBoundary>
```

## Bonnes pratiques

### 1. Nommage des flags
- Utiliser des noms descriptifs et cohérents
- Préfixer par le domaine fonctionnel
- Éviter les négations dans les noms

### 2. Gestion des dépendances
- Déclarer explicitement les dépendances entre flags
- Tester les combinaisons de flags
- Éviter les dépendances circulaires

### 3. Monitoring
- Définir des seuils appropriés pour chaque flag
- Surveiller les métriques en continu
- Réagir rapidement aux alertes

### 4. Nettoyage
- Supprimer les flags obsolètes régulièrement
- Documenter le cycle de vie des flags
- Planifier la suppression dès la création

## Rollback et récupération

### Rollback automatique
Le système peut automatiquement désactiver un flag si:
- Le taux d'erreur dépasse le seuil configuré
- Le temps de réponse est trop élevé
- Une régression est détectée

### Rollback manuel
```typescript
// Désactivation immédiate d'un flag
getFeatureFlagManager().override(FEATURE_FLAGS.ENHANCED_ERROR_HANDLING, false)

// Ou via les outils de développement
window.featureFlags.disableFeature('enhanced_error_handling')
```

### Plan de récupération
1. **Détection**: Monitoring automatique ou alerte manuelle
2. **Évaluation**: Analyse des métriques et logs
3. **Action**: Rollback automatique ou manuel
4. **Communication**: Notification des équipes concernées
5. **Investigation**: Analyse post-mortem et corrections

## Exemples d'utilisation

### Composant avec fallback
```typescript
function PitchGenerator() {
  const { enabled } = useFeatureFlag(FEATURE_FLAGS.FULL_ENHANCED_SYSTEM)
  
  if (!enabled) {
    return <LegacyPitchGenerator />
  }
  
  return (
    <ErrorBoundary fallback={<LegacyPitchGenerator />}>
      <EnhancedPitchGenerator />
    </ErrorBoundary>
  )
}
```

### Hook avec monitoring
```typescript
function useEnhancedFeature() {
  const { enabled, recordMetric } = useFeatureFlag(FEATURE_FLAGS.INTELLIGENT_RETRY)
  
  const performAction = useCallback(async () => {
    const startTime = performance.now()
    
    try {
      const result = await enhancedAction()
      recordMetric('success', performance.now() - startTime)
      return result
    } catch (error) {
      recordMetric('error', performance.now() - startTime)
      
      if (enabled) {
        // Retry logic
        return await retryAction()
      }
      
      throw error
    }
  }, [enabled, recordMetric])
  
  return { performAction, enabled }
}
```

## Maintenance

### Cycle de vie d'un flag
1. **Création**: Définition et configuration initiale
2. **Test**: Validation en développement
3. **Déploiement**: Rollout progressif en production
4. **Monitoring**: Surveillance continue
5. **Stabilisation**: Passage à 100% des utilisateurs
6. **Nettoyage**: Suppression du flag et intégration permanente

### Révision périodique
- **Hebdomadaire**: Vérification des métriques et alertes
- **Mensuelle**: Révision des flags actifs et planification
- **Trimestrielle**: Nettoyage des flags obsolètes
- **Annuelle**: Révision complète de la stratégie

Cette documentation doit être mise à jour à chaque modification du système de feature flags.