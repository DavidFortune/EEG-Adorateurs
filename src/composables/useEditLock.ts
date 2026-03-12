import { ref, computed, watch, onMounted, onUnmounted, type Ref } from 'vue';
import { toastController } from '@ionic/vue';
import {
  acquireEditLock,
  releaseEditLock,
  forceAcquireEditLock
} from '@/firebase/programs';
import type { ServiceProgram } from '@/types/program';

export function useEditLock(
  program: Ref<ServiceProgram | null>,
  user: Ref<{ uid: string; displayName?: string | null; email?: string | null } | null>,
  isAdmin: Ref<boolean>,
  isDraft: Ref<boolean>,
  isPublished: Ref<boolean>
) {
  const lockTimeRemaining = ref(0);
  const countdownInterval = ref<ReturnType<typeof setInterval> | null>(null);
  const hasShown30sWarning = ref(false);

  const isEditing = computed(() => {
    if (!isAdmin.value || !program.value || !user.value) return false;
    if (isDraft.value) return true;
    if (!program.value.editLock) return false;
    const lock = program.value.editLock;
    return lock.userId === user.value.uid && lock.expiresAt.getTime() > Date.now();
  });

  const isLockedByOther = computed(() => {
    if (!isPublished.value) return false;
    if (!program.value?.editLock || !user.value) return false;
    const lock = program.value.editLock;
    return lock.userId !== user.value.uid && lock.expiresAt.getTime() > Date.now();
  });

  const lockHolder = computed(() => {
    if (!isLockedByOther.value || !program.value?.editLock) return null;
    return {
      userName: program.value.editLock.userName,
      expiresAt: program.value.editLock.expiresAt
    };
  });

  const formattedLockTime = computed(() => {
    const secs = lockTimeRemaining.value;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  });

  const isTimerWarning = computed(() => lockTimeRemaining.value <= 120 && lockTimeRemaining.value > 0);

  const showToast = async (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    const toast = await toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  };

  const updateCountdown = () => {
    if (!program.value?.editLock) {
      lockTimeRemaining.value = 0;
      return;
    }
    const remaining = Math.max(0, Math.floor((program.value.editLock.expiresAt.getTime() - Date.now()) / 1000));
    lockTimeRemaining.value = remaining;

    if (remaining <= 30 && remaining > 0 && !hasShown30sWarning.value) {
      hasShown30sWarning.value = true;
      showToast('Votre session d\'édition expire bientôt', 'warning');
    }

    if (remaining <= 0) {
      handleLockExpired();
    }
  };

  const stopCountdown = () => {
    if (countdownInterval.value) {
      clearInterval(countdownInterval.value);
      countdownInterval.value = null;
    }
  };

  const startCountdown = () => {
    stopCountdown();
    hasShown30sWarning.value = false;
    updateCountdown();
    countdownInterval.value = setInterval(updateCountdown, 1000);
  };

  const handleLockExpired = async () => {
    stopCountdown();
    lockTimeRemaining.value = 0;
    if (program.value && user.value) {
      try {
        await releaseEditLock(program.value.id, user.value.uid);
      } catch (e) { /* best effort */ }
    }
    showToast('Session d\'édition expirée', 'warning');
  };

  const enterEditMode = async () => {
    if (!program.value || !user.value || !isPublished.value) return;
    const displayName = user.value.displayName || user.value.email || 'Utilisateur';
    const result = await acquireEditLock(program.value.id, user.value.uid, displayName);
    if (result.success) {
      startCountdown();
    } else if (result.holder) {
      showToast(`${result.holder.userName} est en train de modifier ce programme`, 'warning');
    }
  };

  const exitEditMode = async () => {
    stopCountdown();
    if (!program.value || !user.value || !isPublished.value) return;
    try {
      await releaseEditLock(program.value.id, user.value.uid);
    } catch (e) {
      console.error('Error releasing edit lock:', e);
    }
  };

  const forceEnterEditMode = async () => {
    if (!program.value || !user.value || !isPublished.value) return;
    const displayName = user.value.displayName || user.value.email || 'Utilisateur';
    const result = await forceAcquireEditLock(program.value.id, user.value.uid, displayName);
    startCountdown();
    if (result.previousHolder) {
      showToast(`Vous avez pris le contrôle de l'édition de ${result.previousHolder.userName}`, 'warning');
    }
  };

  const extendEditMode = async () => {
    if (!program.value || !user.value || !isPublished.value) return;
    const displayName = user.value.displayName || user.value.email || 'Utilisateur';
    const result = await acquireEditLock(program.value.id, user.value.uid, displayName);
    if (result.success) {
      hasShown30sWarning.value = false;
      showToast('Session d\'édition prolongée', 'success');
    }
  };

  const handleBeforeUnload = () => {
    if (isEditing.value && isPublished.value && program.value && user.value) {
      releaseEditLock(program.value.id, user.value.uid).catch(() => {});
    }
  };

  // Watch for lock displacement by another user
  watch(() => program.value?.editLock, (newLock, oldLock) => {
    if (!user.value || !oldLock) return;
    if (oldLock.userId === user.value.uid && newLock && newLock.userId !== user.value.uid) {
      stopCountdown();
      lockTimeRemaining.value = 0;
      showToast(`${newLock.userName} a pris le contrôle de l'édition`, 'warning');
    }
    if (newLock && newLock.userId === user.value.uid && newLock.expiresAt.getTime() > Date.now()) {
      startCountdown();
    }
  }, { deep: true });

  // Lifecycle
  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
  });

  onUnmounted(() => {
    if (isEditing.value && program.value && user.value) {
      releaseEditLock(program.value.id, user.value.uid).catch(() => {});
    }
    stopCountdown();
    window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  return {
    isEditing,
    isLockedByOther,
    lockHolder,
    formattedLockTime,
    isTimerWarning,
    enterEditMode,
    exitEditMode,
    forceEnterEditMode,
    extendEditMode
  };
}
