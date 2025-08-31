import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { OnboardingFormData, Member } from '@/types/member';
import type { Service } from '@/types/service';

export const useOnboardingStore = defineStore('onboarding', () => {
  const currentStep = ref(0);
  const totalSteps = 6;
  
  const formData = ref<OnboardingFormData>({
    email: '',
    fullName: '',
    teams: [],
    customTeam: '',
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

  const selectedTeamsCount = computed(() => {
    return formData.value.teams.length + (formData.value.customTeam.trim() ? 1 : 0);
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

  const addTeam = (team: string) => {
    if (!formData.value.teams.includes(team)) {
      formData.value.teams.push(team);
    }
  };

  const removeTeam = (team: string) => {
    const index = formData.value.teams.indexOf(team);
    if (index > -1) {
      formData.value.teams.splice(index, 1);
    }
  };

  const toggleTeam = (team: string) => {
    if (formData.value.teams.includes(team)) {
      removeTeam(team);
    } else {
      addTeam(team);
    }
  };

  const setAvailability = (serviceId: string, availability: 'available' | 'unavailable' | null) => {
    if (availability === null) {
      delete formData.value.availabilities[serviceId];
    } else {
      formData.value.availabilities[serviceId] = availability;
    }
  };

  const resetForm = () => {
    formData.value = {
      email: '',
      fullName: '',
      teams: [],
      customTeam: '',
      availabilities: {}
    };
    currentStep.value = 0;
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
    selectedTeamsCount,
    nextStep,
    previousStep,
    goToStep,
    updateFormData,
    addTeam,
    removeTeam,
    toggleTeam,
    setAvailability,
    resetForm,
    setAvailableServices
  };
});