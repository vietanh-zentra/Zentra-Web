// Calculate Aryan's age based on his birthday
// Aryan's birthday is 15th November 2019
// This is a dynamic calculation based on the current date

export function getAryanAge() {
  // Aryan was born on 15th November 2019
  const birthDate = new Date(2019, 10, 15); // Month is 0-indexed, so 10 = November
  const currentDate = new Date();

  let age = currentDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = currentDate.getMonth() - birthDate.getMonth();

  // If the birthday hasn't occurred this year yet, subtract 1
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return Math.max(age, 0); // Ensure minimum age of 0
}

export function getAryanAgeText() {
  const age = getAryanAge();
  return `${age} years old`;
}
