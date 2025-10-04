<template>
  <ion-card>
    <ion-card-header>
      <ion-card-title>
        <ion-icon :icon="warningOutline" color="danger"></ion-icon>
        Tableau de bord des erreurs
      </ion-card-title>
      <ion-card-subtitle>
        Suivi des erreurs et taux de récupération
      </ion-card-subtitle>
    </ion-card-header>

    <ion-card-content>
      <!-- Summary Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ metrics.totalErrors }}</div>
          <div class="stat-label">Total Erreurs</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">{{ metrics.errorRate.toFixed(2) }}</div>
          <div class="stat-label">Erreurs/min</div>
        </div>

        <div class="stat-card">
          <div class="stat-value" :style="{ color: getRecoveryColor() }">
            {{ recoveryRate.toFixed(0) }}%
          </div>
          <div class="stat-label">Taux de récupération</div>
        </div>

        <div class="stat-card">
          <div class="stat-value" :style="{ color: getCriticalColor() }">
            {{ criticalErrors.length }}
          </div>
          <div class="stat-label">Erreurs Critiques</div>
        </div>
      </div>

      <!-- Errors by Category -->
      <div class="section">
        <h3>Erreurs par catégorie</h3>
        <div class="category-list">
          <div
            v-for="(count, category) in metrics.errorsByCategory"
            :key="category"
            class="category-item"
            v-show="count > 0"
          >
            <span class="category-name">{{ formatCategory(category) }}</span>
            <span class="category-count">{{ count }}</span>
            <div class="category-bar">
              <div
                class="category-bar-fill"
                :style="{ width: getCategoryPercentage(count) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Errors by Severity -->
      <div class="section">
        <h3>Erreurs par gravité</h3>
        <div class="severity-list">
          <div
            v-for="(count, severity) in metrics.errorsBySeverity"
            :key="severity"
            class="severity-item"
            v-show="count > 0"
          >
            <ion-badge :color="getSeverityColor(severity as string)">
              {{ formatSeverity(severity) }}: {{ count }}
            </ion-badge>
          </div>
        </div>
      </div>

      <!-- Most Frequent Errors -->
      <div class="section" v-if="metrics.mostFrequentErrors.length > 0">
        <h3>Erreurs les plus fréquentes</h3>
        <ion-list>
          <ion-item
            v-for="error in metrics.mostFrequentErrors.slice(0, 5)"
            :key="error.message"
          >
            <ion-label>
              <h4>{{ truncateMessage(error.message) }}</h4>
              <p>
                <ion-badge :color="getCategoryColor(error.category)">
                  {{ formatCategory(error.category) }}
                </ion-badge>
                <span class="error-count"> × {{ error.count }}</span>
              </p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>

      <!-- Recent Errors -->
      <div class="section" v-if="metrics.recentErrors.length > 0">
        <h3>Erreurs récentes</h3>
        <ion-list>
          <ion-item
            v-for="error in metrics.recentErrors.slice(-5).reverse()"
            :key="error.id"
          >
            <ion-icon
              :icon="error.recovered ? checkmarkCircleOutline : closeCircleOutline"
              :color="error.recovered ? 'success' : 'danger'"
              slot="start"
            ></ion-icon>
            <ion-label>
              <h4>{{ truncateMessage(error.message) }}</h4>
              <p>
                <ion-badge :color="getSeverityColor(error.severity)">
                  {{ formatSeverity(error.severity) }}
                </ion-badge>
                <span class="timestamp">{{ formatTimestamp(error.timestamp) }}</span>
              </p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>

      <!-- Actions -->
      <div class="actions">
        <ion-button expand="block" @click="exportErrors" fill="outline">
          <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
          Exporter le rapport
        </ion-button>
        <ion-button expand="block" @click="clearErrors" color="danger" fill="clear">
          <ion-icon :icon="trashOutline" slot="start"></ion-icon>
          Effacer l'historique
        </ion-button>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonIcon,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  alertController
} from '@ionic/vue';
import {
  warningOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  downloadOutline,
  trashOutline
} from 'ionicons/icons';
import { useErrorTracking } from '@/composables/useErrorTracking';
import type { ErrorCategory, ErrorSeverity } from '@/types/error';

const { getMetrics, getCriticalErrors, getRecoveryRate, exportSummary, clearErrors: clearErrorHistory } = useErrorTracking();

const metrics = ref(getMetrics());
const criticalErrors = ref(getCriticalErrors());
const recoveryRate = ref(getRecoveryRate());

// Refresh metrics periodically
const refreshMetrics = () => {
  metrics.value = getMetrics();
  criticalErrors.value = getCriticalErrors();
  recoveryRate.value = getRecoveryRate();
};

onMounted(() => {
  // Refresh every 10 seconds
  const interval = setInterval(refreshMetrics, 10000);

  // Cleanup
  return () => clearInterval(interval);
});

// Format helpers
const formatCategory = (category: string) => {
  const labels: Record<string, string> = {
    network: 'Réseau',
    authentication: 'Authentification',
    authorization: 'Autorisation',
    validation: 'Validation',
    firestore: 'Firestore',
    storage: 'Stockage',
    performance: 'Performance',
    ui: 'Interface',
    unknown: 'Inconnu'
  };
  return labels[category] || category;
};

const formatSeverity = (severity: string) => {
  const labels: Record<string, string> = {
    low: 'Faible',
    medium: 'Moyen',
    high: 'Élevé',
    critical: 'Critique'
  };
  return labels[severity] || severity;
};

const formatTimestamp = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return 'À l\'instant';
  if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;

  return new Date(timestamp).toLocaleString('fr-CA');
};

const truncateMessage = (message: string, maxLength = 60) => {
  return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
};

// Color helpers
const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    critical: 'danger'
  };
  return colors[severity] || 'medium';
};

const getCategoryColor = (category: ErrorCategory) => {
  const colors: Record<string, string> = {
    network: 'warning',
    authentication: 'danger',
    authorization: 'danger',
    validation: 'warning',
    firestore: 'primary',
    storage: 'primary',
    performance: 'tertiary',
    ui: 'secondary',
    unknown: 'medium'
  };
  return colors[category] || 'medium';
};

const getRecoveryColor = () => {
  if (recoveryRate.value >= 80) return '#10b981';
  if (recoveryRate.value >= 50) return '#f59e0b';
  return '#ef4444';
};

const getCriticalColor = () => {
  if (criticalErrors.value.length === 0) return '#10b981';
  if (criticalErrors.value.length <= 2) return '#f59e0b';
  return '#ef4444';
};

const getCategoryPercentage = (count: number) => {
  if (metrics.value.totalErrors === 0) return 0;
  return (count / metrics.value.totalErrors) * 100;
};

// Actions
const exportErrors = () => {
  const summary = exportSummary();
  const blob = new Blob([summary], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `error-report-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const clearErrors = async () => {
  const alert = await alertController.create({
    header: 'Confirmer',
    message: 'Voulez-vous vraiment effacer l\'historique des erreurs ?',
    buttons: [
      {
        text: 'Annuler',
        role: 'cancel'
      },
      {
        text: 'Effacer',
        role: 'confirm',
        handler: () => {
          clearErrorHistory();
          refreshMetrics();
        }
      }
    ]
  });

  await alert.present();
};
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #111827;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.section {
  margin: 1.5rem 0;
}

.section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.category-list,
.severity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-name {
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
}

.category-count {
  font-weight: 600;
  color: #111827;
  min-width: 2rem;
  text-align: right;
}

.category-bar {
  flex: 2;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
}

.category-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #b5121b, #ef4444);
  transition: width 0.3s ease;
}

.severity-list {
  flex-direction: row;
  flex-wrap: wrap;
}

.error-count {
  margin-left: 0.5rem;
  font-weight: 600;
}

.timestamp {
  margin-left: 0.5rem;
  color: #9ca3af;
  font-size: 0.75rem;
}

.actions {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
