import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { OnboardingFormData, Member } from '@/types/member';

export const useOnboardingStore = defineStore('onboarding', () => {
  const currentStep = ref(0);
  const totalSteps = 6;
  const completedSteps = ref<Set<number>>(new Set());

  const formData = ref<OnboardingFormData>({
    email: '',
    fullName: '',
    phone: '',
    ministries: [],
    customMinistry: '',
    availabilities: {}
  });


  const progressPercentage = computed(() => {
    const stepPercentages = [0, 0, 33, 50, 75, 100];
    return stepPercentages[currentStep.value] || 0;
  });

  const isStep3Valid = computed(() => {
    return formData.value.fullName.trim() !== '';
  });

  const isPhoneValid = computed(() => {
    return formData.value.phone.trim() !== '';
  });

  const selectedMinistriesCount = computed(() => {
    const ministries = formData.value.ministries || [];
    const custom = formData.value.customMinistry || '';
    return ministries.length + (custom.trim() ? 1 : 0);
  });

  const nextStep = () => {
    if (currentStep.value < totalSteps - 1) {
      currentStep.value++;
    }
  };

  const previousStep = () => {
    if (currentStep.value > 0) {
      currentStep.value--;
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      currentStep.value = step;
    }
  };

  const updateFormData = (data: Partial<OnboardingFormData>) => {
    formData.value = { ...formData.value, ...data };
  };

  const addMinistry = (ministry: string) => {
    if (!formData.value.ministries.includes(ministry)) {
      formData.value.ministries.push(ministry);
    }
  };

  const removeMinistry = (ministry: string) => {
    const index = formData.value.ministries.indexOf(ministry);
    if (index > -1) {
      formData.value.ministries.splice(index, 1);
    }
  };

  const toggleMinistry = (ministry: string) => {
    if (formData.value.ministries.includes(ministry)) {
      removeMinistry(ministry);
    } else {
      addMinistry(ministry);
    }
  };


  const markStepCompleted = (step: number) => {
    completedSteps.value.add(step);
  };

  const isStepCompleted = (step: number) => {
    return completedSteps.value.has(step);
  };

  const getNextIncompleteStep = () => {
    // Step mapping: 0=welcome, 1=unused, 2=personal-info, 3=phone, 4=ministries, 5=congratulations
    const stepRoutes = [
      '/onboarding/welcome',           // 0
      '/onboarding/welcome',           // 1 (unused)
      '/onboarding/personal-info',     // 2
      '/onboarding/phone',             // 3
      '/onboarding/ministries',        // 4
      '/onboarding/congratulations'    // 5
    ];

    // Check what data exists to determine completion
    const hasPersonalInfo = formData.value.fullName.trim() !== '';
    const hasPhone = formData.value.phone.trim() !== '';
    const hasMinistries = (formData.value.ministries || []).length > 0 ||
                         (formData.value.customMinistry || '').trim() !== '';

    // Mark steps as completed based on data
    if (hasPersonalInfo) markStepCompleted(2);
    if (hasPhone) markStepCompleted(3);
    if (hasMinistries) markStepCompleted(4);

    // Always start from welcome if step 0 is not completed
    if (!isStepCompleted(0)) {
      return stepRoutes[0];
    }

    // Find the first incomplete step starting from personal info
    for (let step = 2; step <= 4; step++) {
      if (!isStepCompleted(step)) {
        return stepRoutes[step];
      }
    }

    // If all steps are completed, go to congratulations
    return stepRoutes[5];
  };

  const resetForm = () => {
    formData.value = {
      email: '',
      fullName: '',
      phone: '',
      ministries: [],
      customMinistry: '',
      availabilities: {}
    };
    currentStep.value = 0;
    completedSteps.value.clear();
  };


  return {
    currentStep,
    totalSteps,
    formData,
    progressPercentage,
    isStep3Valid,
    isPhoneValid,
    selectedMinistriesCount,
    nextStep,
    previousStep,
    goToStep,
    updateFormData,
    addMinistry,
    removeMinistry,
    toggleMinistry,
    resetForm,
    markStepCompleted,
    isStepCompleted,
    getNextIncompleteStep
  };
});