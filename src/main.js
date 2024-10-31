import { translations, updateLanguage } from './translations.js';
import {
  formatArtificialCurrentTime,
  validateArtificialCurrentTimeInput,
  toDecimalHours,
} from './utils.js';
import {
  HOURS_BEFORE_NORMAL_BREAK,
  HOURS_BEFORE_EXTRA_BREAK,
  HOURS_PER_DAY,
  HOURS_PER_WEEK,
  MAX_WORKING_HOURS_DECIMAL,
  PAUSE,
  EXTRA_PAUSE,
} from './constants.js';

let hoursPerWeek = HOURS_PER_WEEK;
let hoursPerDay = HOURS_PER_DAY;

document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    weekHoursRadioGroup: document.getElementsByName('weekHoursRadioGroup'),
    calculateButton: document.getElementById('calculateButton'),
    stopButton: document.getElementById('stopButton'),
    ignoreCurrentTimeCheckbox: document.getElementById('ignoreCurrentTime'),
    artificialCurrentTimeInput: document.getElementById(
      'artificialCurrentTime'
    ),
    artificialCurrentTimeLabel: document.getElementById(
      'artificialCurrentTimeLabel'
    ),
    partTimeRatioElement: document.getElementById('partTimeRatio'),
    startTime: document.getElementById('startTime'),
    overtime: document.getElementById('overtime'),
    killTime: document.getElementById('killTime'),
    minStartTime: document.getElementById('minStartTime'),
    maxEndTime: document.getElementById('maxEndTime'),
    error: document.getElementById('error'),
    result: document.getElementById('result'),
    options: document.getElementById('options'),
    optionToggle: document.getElementById('optionToggle'),
  };

  const toggleOptionsVisibility = () => {
    elements.optionToggle.addEventListener('click', () => {
      elements.options.style.display =
        elements.options.style.display === 'none' ? 'flex' : 'none';
    });
  };

  const calculateWorkingHours = () => {
    const updateWorkingHours = (e) => {
      const partTimeRatio = e.target.value;
      elements.partTimeRatioElement.textContent = partTimeRatio + '%';
      return calculateWorkingHoursDecimal(HOURS_PER_DAY, partTimeRatio);
    };

    elements.partTimeRatioElement.addEventListener(
      'change',
      updateWorkingHours
    );
    return calculateWorkingHoursDecimal(
      HOURS_PER_DAY,
      elements.partTimeRatioElement.value
    );
  };

  const handleWeekHoursChange = () => {
    elements.weekHoursRadioGroup.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        hoursPerWeek = e.target.value === '38' ? 38 : 39;
        HOURS_PER_DAY = hoursPerWeek / 5;
      });
    });
  };

  const setWeeklyWorkingHoursBasedOnYear = () => {
    const currentYear = new Date().getFullYear();
    const is2024 = currentYear === 2024;
    elements.weekHoursRadioGroup[is2024 ? 0 : 1].checked = true;
    hoursPerWeek = is2024 ? 39 : 38;
    hoursPerDay = hoursPerWeek / 5;
  };

  const initialize = () => {
    toggleOptionsVisibility();
    setWeeklyWorkingHoursBasedOnYear();
    handleWeekHoursChange();
    handleIgnoreCurrentTimeChange(
      elements.ignoreCurrentTimeCheckbox,
      elements.artificialCurrentTimeInput,
      elements.artificialCurrentTimeLabel
    );
    updateLanguage();
    toggleButtons();
    formatArtificialCurrentTime(elements.artificialCurrentTimeInput);
    validateArtificialCurrentTimeInput(elements.artificialCurrentTimeInput);
    elements.optionToggle.click();
  };

  const calculate = () => {
    if (window.intervalId) clearInterval(window.intervalId);

    const workingHoursDecimal = calculateWorkingHours();
    const start = new Date(`1970-01-01T${elements.startTime.value}:00`);
    const minStart = new Date(`1970-01-01T${elements.minStartTime.value}:00`);
    const maxEnd = new Date(`1970-01-01T${elements.maxEndTime.value}:00`);
    const overtime = new Date(
      `1970-01-01T${elements.overtime.value || '00:00'}:00`
    );
    const killTime = elements.killTime.checked;
    const language = navigator.language.split('-')[0];

    if (maxEnd <= start) maxEnd.setDate(maxEnd.getDate() + 1);

    const { end, breakTime } = calculateEndAndBreakTime(
      start,
      workingHoursDecimal,
      overtime,
      killTime
    );
    const totalTimeIncludingBreaks = toDecimalHours(end - start);

    if (
      totalTimeIncludingBreaks >=
      MAX_WORKING_HOURS_DECIMAL + breakTime / 60
    ) {
      elements.error.textContent =
        translations[language]['errorWorkingMoreThan10Hours30Minutes'];
      return;
    }

    if (end > maxEnd) {
      elements.error.textContent =
        translations[language]['errorCalculatedTimeIsAfterMax'];
      return;
    }

    const updateRemainingTime = initializeRemainingTimeUpdater(
      language,
      calculateRemainingTime,
      minStart,
      maxEnd,
      end,
      breakTime,
      translations
    );

    updateRemainingTime();
    window.intervalId = setInterval(updateRemainingTime, 1000);
    toggleButtons();
  };

  elements.calculateButton.addEventListener('click', calculate);
  elements.stopButton.addEventListener('click', () => {
    clearInterval(window.intervalId);
    window.intervalId = null;
    toggleButtons();
  });

  initialize();
});

function calculateRemainingTime(
  now,
  minStart,
  maxEnd,
  end,
  breakTime,
  language,
  translations
) {
  const result = document.getElementById('result');
  const breakTimeDisplay = document.getElementById('breakTime');
  const endTimeDisplay = document.getElementById('endTime');
  const ignoreCurrentTimeCheckbox =
    document.getElementById('ignoreCurrentTime');
  const artificialCurrentTimeInput = document.getElementById(
    'artificialCurrentTime'
  );

  if (now < minStart || now > maxEnd) {
    result.textContent =
      translations[language]['errorStartTimeBeforCurrentOrAfterMax'];
    return;
  }

  let remainingTimeMs = end - now;

  if (remainingTimeMs < 0) {
    result.textContent = `${
      translations[language]['errorStartTimeBeforCurrentOrAfterMax']
    } Arbeitsende war ${end.toLocaleTimeString().slice(0, 8)}`;
    breakTimeDisplay.textContent = '';
    endTimeDisplay.textContent = '';
    return;
  }

  const remainingHours = Math.floor(toDecimalHours(remainingTimeMs));
  const remainingMinutes = Math.floor(
    (remainingTimeMs % (1000 * 60 * 60)) / 1000 / 60
  );
  const remainingSeconds = Math.floor((remainingTimeMs % (1000 * 60)) / 1000);

  result.textContent = translations[language]['result'](
    remainingHours,
    remainingMinutes,
    remainingSeconds
  );
  breakTimeDisplay.textContent = translations[language]['breakTime'](breakTime);
  endTimeDisplay.textContent = translations[language]['endTime'](
    end.toLocaleTimeString().slice(0, 8)
  );

  if (ignoreCurrentTimeCheckbox.checked) {
    let artificialNow = new Date(now.getTime() + 1000);
    artificialCurrentTimeInput.value = `${String(
      artificialNow.getHours()
    ).padStart(2, '0')}:${String(artificialNow.getMinutes()).padStart(
      2,
      '0'
    )}:${String(artificialNow.getSeconds()).padStart(2, '0')}`;
  }
}

function handleIgnoreCurrentTimeChange(
  ignoreCurrentTimeCheckbox,
  artificialCurrentTimeInput,
  artificialCurrentTimeLabel
) {
  ignoreCurrentTimeCheckbox.addEventListener('change', () => {
    if (ignoreCurrentTimeCheckbox.checked) {
      artificialCurrentTimeInput.style.display = 'inline';
      artificialCurrentTimeLabel.style.display = 'inline';
    } else {
      artificialCurrentTimeInput.style.display = 'none';
      artificialCurrentTimeLabel.style.display = 'none';
    }
  });
}

function calculateWorkingHoursDecimal(hoursPerDay, partTimeRatio) {
  return hoursPerDay * (partTimeRatio / 100);
}

function calculateEndAndBreakTime(
  start,
  workingHoursDecimal,
  overtime,
  killTime
) {
  const end = new Date(start);
  const totalMinutes =
    workingHoursDecimal * 60 +
    (killTime ? -1 : 1) * (overtime.getHours() * 60 + overtime.getMinutes());
  end.setMinutes(end.getMinutes() + totalMinutes);

  let breakTime = 0;
  const totalWorkTime = toDecimalHours(end - start);

  if (totalWorkTime > HOURS_BEFORE_EXTRA_BREAK) {
    breakTime = PAUSE + EXTRA_PAUSE;
  } else if (totalWorkTime >= HOURS_BEFORE_NORMAL_BREAK) {
    breakTime = PAUSE;
  }

  end.setMinutes(end.getMinutes() + breakTime);
  return { end, breakTime };
}

function initializeRemainingTimeUpdater(
  language,
  calculateRemainingTime,
  minStart,
  maxEnd,
  end,
  breakTime,
  translations
) {
  return () => {
    let now;
    const ignoreCurrentTimeCheckbox =
      document.getElementById('ignoreCurrentTime');
    const artificialCurrentTimeInput = document.getElementById(
      'artificialCurrentTime'
    );

    if (ignoreCurrentTimeCheckbox.checked) {
      const artificialCurrentTime = artificialCurrentTimeInput.value;
      if (!artificialCurrentTime) {
        document.getElementById('result').textContent =
          translations[language]['pleaseEnterArtificialCurrentTime'];
        return;
      }
      let [hours, minutes, seconds] = artificialCurrentTime
        .split(':')
        .map(Number);
      hours = String(hours).padStart(2, '0');
      minutes = String(minutes).padStart(2, '0');
      seconds = String(seconds).padStart(2, '0');
      now = new Date(`1970-01-01T${hours}:${minutes}:${seconds}`);
    } else {
      now = new Date();
    }

    calculateRemainingTime(
      now,
      minStart,
      maxEnd,
      end,
      breakTime,
      language,
      translations
    );
  };
}


function toggleButtons() {
  if (window.intervalId) {
    stopButton.style.display = 'block';
    calculateButton.style.display = 'none';
  } else {
    stopButton.style.display = 'none';
    calculateButton.style.display = 'block';
  }
}
