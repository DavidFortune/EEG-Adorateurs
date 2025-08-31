import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { OnboardingFormData, Member } from '@/types/member';
import type { Service } from '@/types/service';

export const useOnboardingStore = defineStore('onboarding', () => {
  const currentStep = ref(0);
  const totalSteps = 6;
  const completedSteps = ref<Set<number>>(new Set());
  
  const formData = ref<OnboardingFormData>({
    email: '',
    fullName: '',
    ministries: [],
    customMinistry: '',
    availabilities: {}
  });

  const availableServices = ref<Service[]>([]);

  const progressPercentage = computed(() => {
    const stepPercentages = [0, 0, 33, 66, 85, 100];
    return stepPercentages[currentStep.value] || 0;
  });

  const isStep3Valid = computed(() => {
    return formData.value.fullName.trim() !== '';
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

  const setAvailability = (serviceId: string, availability: 'available' | 'unavailable' | null) => {
    if (availability === null) {
      delete formData.value.availabilities[serviceId];
    } else {
      formData.value.availabilities[serviceId] = availability;
    }
  };

  const markStepCompleted = (step: number) => {
    completedSteps.value.add(step);
  };

  const isStepCompleted = (step: number) => {
    return completedSteps.value.has(step);
  };

  const getNextIncompleteStep = () => {
    // Step mapping: 0=welcome, 1=unused, 2=personal-info, 3=ministries, 4=availability, 5=congratulations
    const stepRoutes = [
      '/onboarding/welcome',           // 0
      '/onboarding/welcome',           // 1 (unused)
      '/onboarding/personal-info',     // 2
      '/onboarding/ministries',        // 3
      '/onboarding/availability',      // 4
      '/onboarding/congratulations'    // 5
    ];

    // Check what data exists to determine completion
    const hasPersonalInfo = formData.value.fullName.trim() !== '';
    const hasMinistries = (formData.value.ministries || []).length > 0 || 
                         (formData.value.customMinistry || '').trim() !== '';
    const hasAvailabilities = Object.keys(formData.value.availabilities).length > 0;

    // Mark steps as completed based on data
    if (hasPersonalInfo) markStepCompleted(2);
    if (hasMinistries) markStepCompleted(3);
    if (hasAvailabilities) markStepCompleted(4);

    // Find the first incomplete step
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
      ministries: [],
      customMinistry: '',
      availabilities: {}
    };
    currentStep.value = 0;
    completedSteps.value.clear();
  };

  const setAvailableServices = (services: Service[]) => {
    availableServices.value = services;
    // Reset availabilities for new services
    formData.value.availabilities = {};
  };

  return {
    currentStep,
    totalSteps,
    formData,
    availableServices,
    progressPercentage,
    isStep3Valid,
    selectedMinistriesCount,
    nextStep,
    previousStep,
    goToStep,
    updateFormData,
    addMinistry,
    removeMinistry,
    toggleMinistry,
    setAvailability,
    resetForm,
    setAvailableServices,
    markStepCompleted,
    isStepCompleted,
    getNextIncompleteStep
  };
});