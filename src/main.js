import { translations, updateLanguage } from './translations.js';

const HOURS_BEFORE_EXTRA_BREAK = 9;
const MAX_WORKING_HOURS_DECIMAL = 10;
const PAUSE = 30;
const EXTRA_PAUSE = 15;
let HOURS_PER_WEEK = 39; // change me later
let HOURS_PER_DAY = HOURS_PER_WEEK / 5; // change me later

document.addEventListener('DOMContentLoaded', () => {
  const weekHoursRadioGroup = document.getElementsByName('weekHoursRadioGroup');
  const calculateButton = document.getElementById('calculateButton');
  const stopButton = document.getElementById('stopButton');
  const result = document.getElementById('result');
  const breakTimeDisplay = document.getElementById('breakTime');
  const endTimeDisplay = document.getElementById('endTime');
  const ignoreCurrentTimeCheckbox =
    document.getElementById('ignoreCurrentTime');
  const artificialCurrentTimeInput = document.getElementById(
    'artificialCurrentTime'
  );
  const artificialCurrentTimeLabel = document.getElementById(
    'artificialCurrentTimeLabel'
  );

  const partTimeRatio = document.getElementById('partTimeRatio');
  let workingHoursDecimal;

  // event listener for the radio group to update the sum of hours per week, between 38 or 39
  weekHoursRadioGroup.forEach((radio) => {
    radio.addEventListener('change', function (e) {
      if (e.target.value === '38') {
        HOURS_PER_WEEK = 38;
        HOURS_PER_DAY = HOURS_PER_WEEK / 5;
      } else {
        HOURS_PER_WEEK = 39;
        HOURS_PER_DAY = HOURS_PER_WEEK / 5;
      }

      workingHoursDecimal = calculateWorkingHours(partTimeRatio);
    });
  });

  handleIgnoreCurrentTimeChange(
    ignoreCurrentTimeCheckbox,
    artificialCurrentTimeInput,
    artificialCurrentTimeLabel
  );

  updateLanguage();
  toggleButtons();
  formatArtificialCurrentTime(artificialCurrentTimeInput);
  validateArtificialCurrentTimeInput(artificialCurrentTimeInput);
  workingHoursDecimal = calculateWorkingHours(partTimeRatio);

  // Event listener for the calculate button
  calculateButton.addEventListener('click', () => {
    if (window.intervalId) {
      clearInterval(window.intervalId);
    }

    // Get new values each time the calculate button is clicked
    const startTime = document.getElementById('startTime').value;
    let overtimeInputValue =
      document.getElementById('overtime').value || '00:00';
    const minStartTime = document.getElementById('minStartTime').value;
    const maxEndTime = document.getElementById('maxEndTime').value;
    const language = navigator.language.split('-')[0]; // Assuming this is part of your translations

    // Validate overtime input
    const overtimeInputValueTemp = overtimeInputValue.split(':');
    let overtimeHours = Number(overtimeInputValueTemp[0]);
    let overtimeMinutes = Number(overtimeInputValueTemp[1]);
    if (overtimeHours > 2 || (overtimeHours === 2 && overtimeMinutes > 12)) {
      document.getElementById('error').textContent =
        translations[language]['errorOvertimeExceedsMax'];
      document.getElementById('error').style.color = 'red';
      return;
    }

    // Parse times into Date objects
    const start = new Date(`1970-01-01T${startTime}:00`);
    const minStart = new Date(`1970-01-01T${minStartTime}:00`);
    let overtime = new Date(`1970-01-01T${overtimeInputValue}:00`);
    let maxEnd = new Date(`1970-01-01T${maxEndTime}:00`);

    if (maxEnd <= start) {
      maxEnd.setDate(maxEnd.getDate() + 1);
    }

    let { end, breakTime } = calculateEndAndBreakTime(
      start,
      workingHoursDecimal,
      overtime
    );

    const totalTimeIncludingBreaks = toDecimalHours(end - start);
    if (
      totalTimeIncludingBreaks >=
      MAX_WORKING_HOURS_DECIMAL + breakTime / 60
    ) {
      document.getElementById('error').textContent =
        translations[language]['errorWorkingMoreThan10Hours30Minutes'];
    }

    if (end > maxEnd) {
      document.getElementById('error').textContent =
        translations[language]['errorCalculatedTimeIsAfterMax'];
    }

    // Create the interval function
    const updateRemainingTime = initializeRemainingTimeUpdater(
      language,
      calculateRemainingTime,
      minStart,
      maxEnd,
      end,
      breakTime,
      translations
    );
    // Call the update function immediately, and then set an interval to update every second
    updateRemainingTime();
    window.intervalId = setInterval(updateRemainingTime, 1000);
    toggleButtons();
  });

  stopButton.addEventListener('click', () => {
    clearInterval(window.intervalId);
    window.intervalId = null;
    toggleButtons();
  });
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
    result.textContent =
      translations[language]['errorStartTimeBeforCurrentOrAfterMax'];
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

  // If we're using artificial time, update the artificial time field to increment
  if (ignoreCurrentTimeCheckbox.checked) {
    let artificialNow = new Date(now.getTime() + 1000);
    let hours = String(artificialNow.getHours()).padStart(2, '0');
    let minutes = String(artificialNow.getMinutes()).padStart(2, '0');
    let seconds = String(artificialNow.getSeconds()).padStart(2, '0');
    artificialCurrentTimeInput.value = `${hours}:${minutes}:${seconds}`;
  }
}

function validateArtificialCurrentTimeInput(artificialCurrentTimeInput) {
  artificialCurrentTimeInput.addEventListener('blur', function (e) {
    const value = e.target.value;

    // Ensure input is exactly in HH:MM:SS format when the user leaves the input
    if (/^\d{2}:\d{2}$/.test(value)) {
      e.target.value = value + ':00';
    }
  });
}

function formatArtificialCurrentTime(artificialCurrentTimeInput) {
  artificialCurrentTimeInput.addEventListener('input', function (e) {
    let value = e.target.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters

    if (value.length >= 4) {
      // Insert colon at the correct positions for HH:MM
      value = value.slice(0, 2) + ':' + value.slice(2, 4);
    }

    if (value.length === 5 || value.length === 6) {
      // Append seconds as '00' if not present
      value += ':00';
    } else if (value.length >= 7) {
      // Insert seconds if provided
      value = value.slice(0, 5) + ':' + value.slice(5, 7);
    }

    // Limit input to HH:MM:SS format
    if (value.length > 8) {
      value = value.slice(0, 8);
    }

    e.target.value = value;
  });
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

function calculateWorkingHours(partTimeRatio) {
  let workingHoursDecimal = HOURS_PER_DAY;
  partTimeRatio.addEventListener('change', function (e) {
    workingHoursDecimal = HOURS_PER_DAY;
    // Update the working hours decimal based on the part-time ratio
    workingHoursDecimal = workingHoursDecimal * (e.target.value / 100);
    document.getElementById('ratio').textContent = e.target.value + '%';
  });
  return workingHoursDecimal;
}

function calculateEndAndBreakTime(start, workingHoursDecimal, overtime) {
  let end = new Date(start);
  end.setHours(
    end.getHours() + (workingHoursDecimal % 10) + overtime.getHours()
  );
  end.setMinutes(
    end.getMinutes() + (workingHoursDecimal % 1) * 60 + overtime.getMinutes()
  );

  let breakTime = PAUSE;
  const totalWorkTime = Number(toDecimalHours(end - start).toFixed(1));
  if (totalWorkTime > HOURS_BEFORE_EXTRA_BREAK) {
    breakTime += EXTRA_PAUSE;
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

function toDecimalHours(time) {
  return time / 1000 / 60 / 60;
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
