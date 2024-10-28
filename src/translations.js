export const translations = {
  en: {
    title: '9 to 5',
    header: 'Work Time Calculator',
    labelStartTime: 'Start Time:',
    labelIgnoreCurrentTime: 'Ignore Current Time',
    labelArtificialCurrentTime: 'Artificial Current Time:',
    labelOvertime: 'Overtime (hours):',
    labelMinStartTime: 'Minimum Start Time:',
    labelMaxEndTime: 'Maximum End Time:',
    labelPartTimeRatio: 'Part Time Ratio:',
    labelKillTime: 'reduce',
    labelOptionToggle: 'Toggle Options',
    buttonCalculate: 'Calculate Remaining Time',
    buttonStop: 'Stop',
    result: (remainingHours, remainingMinutes, remainingSeconds) =>
      `Remaining Time: ${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s`,
    breakTime: (breakTime) => `Break Time: ${breakTime} minutes`,
    endTime: (endTime) => `Calculated End Time (break inkl.): ${endTime}`,
    ignoreCurrentTime: 'Ignore current time',
    artificialCurrentTime: 'Artificial current time',
    calculate: 'Calculate',
    actualStartTime: 'Actual start time',
    minimumStartTime: 'Minimum start time',
    maximumEndTime: 'Maximum end time',
    overtime: 'Overtime',
    pleaseEnterArtificialCurrentTime:
      'Please enter the artificial current time.',
    errorWorkingMoreThan10Hours30Minutes:
      "Attention: You shouldn't work more than 10 hours and 30 minutes!",
    errorStartTimeBeforCurrentOrAfterMax:
      "Attention: You shouldn't be working right now!",
    errorCalculatedTimeIsAfterMax:
      'Error: Calculated end time is after the maximum end time.',
    errorOvertimeExceedsMax: 'Error: Overtime should not exceed 02:12.',
  },
  de: {
    title: '9 to 5',
    header: '9 to 5 - Arbeitszeitrechner',
    labelStartTime: 'Startzeit:',
    labelIgnoreCurrentTime: 'Aktuelle Zeit ignorieren',
    labelArtificialCurrentTime: 'Künstliche aktuelle Zeit:',
    labelOvertime: 'Überstunden (Stunden):',
    labelMinStartTime: 'Minimale Startzeit:',
    labelMaxEndTime: 'Maximale Endzeit:',
    labelPartTimeRatio: 'Teilzeitverhältnis:',
    labelKillTime: 'abbauen',
    labelOptionToggle: 'Optionen umschalten',
    buttonCalculate: 'Verbleibende Zeit berechnen',
    buttonStop: 'Stoppen',
    result: (remainingHours, remainingMinutes, remainingSeconds) =>
      `Verbleibende Zeit: ${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s`,
    breakTime: (breakTime) => `Pausenzeit: ${breakTime} Minuten`,
    endTime: (endTime) => `Berechnete Endzeit (Pause inkl.): ${endTime}`,
    ignoreCurrentTime: 'Aktuelle Zeit ignorieren',
    artificialCurrentTime: 'Künstliche aktuelle Zeit',
    calculate: 'Berechnen',
    actualStartTime: 'Tatsächliche Startzeit',
    minimumStartTime: 'Minimale Startzeit',
    maximumEndTime: 'Maximale Endzeit',
    overtime: 'Überstunden',
    pleaseEnterArtificialCurrentTime:
      'Bitte geben Sie die künstliche aktuelle Zeit ein.',
    errorWorkingMoreThan10Hours30Minutes:
      'Achtung: Du darfst nicht mehr als 10 Stunden und 30 Minuten arbeiten!',
    errorStartTimeBeforCurrentOrAfterMax:
      'Achtung: Du solltest jetzt nicht arbeiten!',
    errorCalculatedTimeIsAfterMax:
      'Fehler: Die berechnete Endzeit ist nach der maximalen Endzeit.',
    errorOvertimeExceedsMax:
      'Fehler: Die Überstunden dürfen 02:12 nicht überschreiten.',
  },
};

export function updateLanguage() {
  const language = navigator.language.split('-')[0];
  document.querySelectorAll('[data-text]').forEach((element) => {
    const key = element.getAttribute('data-text');
    element.textContent = translations[language][key];
  });
}
