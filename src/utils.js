export function formatArtificialCurrentTime(artificialCurrentTimeInput) {
  artificialCurrentTimeInput.addEventListener('input', function (e) {
    let value = e.target.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters

    if (value.length >= 4) {
      value = value.slice(0, 2) + ':' + value.slice(2, 4); // Insert colon for HH:MM
    }

    if (value.length === 5 || value.length === 6) {
      value += ':00'; // Append seconds as '00' if not present
    } else if (value.length >= 7) {
      value = value.slice(0, 5) + ':' + value.slice(5, 7); // Insert seconds if provided
    }

    if (value.length > 8) {
      value = value.slice(0, 8); // Limit input to HH:MM:SS format
    }

    e.target.value = value;
  });
}

export function validateArtificialCurrentTimeInput(artificialCurrentTimeInput) {
  artificialCurrentTimeInput.addEventListener('blur', (e) => {
    const value = e.target.value;
    const timePattern = /^\d{2}:\d{2}$/;

    if (timePattern.test(value)) {
      e.target.value = `${value}:00`;
    }
  });
}

export function toDecimalHours(time) {
  return time / 1000 / 60 / 60;
}
