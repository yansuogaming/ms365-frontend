/** Usage locations offered in user forms (ISO 3166 alpha-2) with their calling codes. Most used first. */
export const countries = [
  ['US', 'United States', '+1'],
  ['VN', 'Vietnam', '+84'],
  ['GB', 'United Kingdom', '+44'],
  ['AU', 'Australia', '+61'],
  ['CA', 'Canada', '+1'],
  ['DE', 'Germany', '+49'],
  ['FR', 'France', '+33'],
  ['SG', 'Singapore', '+65'],
  ['ID', 'Indonesia', '+62'],
  ['TH', 'Thailand', '+66'],
  ['MY', 'Malaysia', '+60'],
  ['PH', 'Philippines', '+63'],
  ['JP', 'Japan', '+81'],
  ['KR', 'South Korea', '+82'],
  ['CN', 'China', '+86'],
  ['IN', 'India', '+91'],
] as const

/** Options for <Select>: "US — United States". */
export const countryOptions = countries.map(([code, name]) => ({ value: code as string, label: `${code} — ${name}` }))

/** Options for a phone country picker: name, with the calling code on the right. */
export const dialOptions = countries.map(([code, name, dial]) => ({ value: code as string, label: name as string, hint: dial as string }))

export function findCountry(code: string) {
  const c = countries.find(([c]) => c === code) ?? countries[0]
  return { code: c[0] as string, name: c[1] as string, dial: c[2] as string }
}
