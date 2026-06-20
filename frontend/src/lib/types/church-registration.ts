export const PUBLIC_REGISTRATION_REQUIRED_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone",
] as const;

export const PUBLIC_REGISTRATION_OPTIONAL_FIELDS = [
  "birth_date",
  "family_name",
  "marital_status",
  "spiritual_status",
  "profession_id",
  "nationality_id",
  "city",
  "address_line",
] as const;

export type PublicRegistrationRequiredField =
  (typeof PUBLIC_REGISTRATION_REQUIRED_FIELDS)[number];

export type PublicRegistrationOptionalField =
  (typeof PUBLIC_REGISTRATION_OPTIONAL_FIELDS)[number];

export type PublicRegistrationField =
  | PublicRegistrationRequiredField
  | PublicRegistrationOptionalField;

export const PUBLIC_REGISTRATION_FIELD_LABEL_KEYS: Record<
  PublicRegistrationOptionalField,
  string
> = {
  birth_date: "churchPeople.birthDate",
  family_name: "churchPeople.familyName",
  marital_status: "churchPeople.maritalStatus",
  spiritual_status: "churchPeople.knower",
  profession_id: "churchPeople.profession",
  nationality_id: "churchPeople.nationality",
  city: "churchPeople.city",
  address_line: "churchPeople.address",
};

export function isPublicRegistrationOptionalField(
  value: string
): value is PublicRegistrationOptionalField {
  return (PUBLIC_REGISTRATION_OPTIONAL_FIELDS as readonly string[]).includes(value);
}
