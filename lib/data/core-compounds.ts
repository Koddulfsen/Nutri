/**
 * Core Compounds Data (Nutri Core)
 *
 * Contains the 160 core compounds with source mappings.
 * These are the compounds that can be imported from food databases.
 *
 * Generated: 2026-04-26T02:41:53.560Z
 *
 * Compound Types:
 * - MACRONUTRIENT: Proteins, fats, carbs, fiber, etc.
 * - VITAMIN: All vitamins and forms
 * - MINERAL: Essential minerals
 * - AMINO_ACID: Essential and non-essential amino acids
 * - ALKALOID: Caffeine, theobromine, etc.
 * - SYNTHETIC_ADDITIVE: Artificial sweeteners, etc.
 */

export interface CoreCompound {
  id: string;
  name: string;
  compound_type: string;
  unit: string;
  parent_compound_id: string | null;
  description: string | null;
}

export const CORE_COMPOUNDS: Readonly<CoreCompound[]> = [
  {
    "id": "25817e68-3ca4-43f2-960b-b9f954a1ba58",
    "name": "Carbohydrates",
    "compound_type": "MACRONUTRIENT",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "bcc46d3a-379f-48d9-b8fd-b8b8d38dfd87",
    "name": "Energy",
    "compound_type": "MACRONUTRIENT",
    "unit": "kcal",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "adf2fde7-f662-4899-a96c-43708fb665a6",
    "name": "Monounsaturated Fat",
    "compound_type": "MACRONUTRIENT",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "7ced5e5b-9968-4577-a62a-268cc420fa1b",
    "name": "Omega-3",
    "compound_type": "MACRONUTRIENT",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "50ac91af-c31a-47f3-995f-a9bc3cf903c6",
    "name": "Omega-6",
    "compound_type": "MACRONUTRIENT",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "91cc12b9-69fd-461d-8f4e-3bfc457b76b0",
    "name": "Protein",
    "compound_type": "MACRONUTRIENT",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "20daa1af-0a5e-416d-a39c-6842c8ce8f8c",
    "name": "Saturated Fat",
    "compound_type": "MACRONUTRIENT",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "4e69ee8d-78e8-4858-9202-85e78dbf2863",
    "name": "Total Fat",
    "compound_type": "MACRONUTRIENT",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "d3cb4ae7-caba-4075-8d67-826a0e2c987b",
    "name": "Trans Fat",
    "compound_type": "MACRONUTRIENT",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "d9920d4b-7a1b-48c4-96a0-7fb24655de5c",
    "name": "Vaccenic Acid (cis)",
    "compound_type": "MACRONUTRIENT",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "9e632f26-4546-4f7e-b644-478824e4ee0a",
    "name": "Vaccenic Acid (trans)",
    "compound_type": "MACRONUTRIENT",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "984e89a2-46e9-4be2-9c22-631c0a282ced",
    "name": "Water",
    "compound_type": "MACRONUTRIENT",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "62b4bb52-8dda-4cdd-8970-3255cf1aa335",
    "name": "Adenosylcobalamin",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "eee5f8ef-ca2d-4a55-9190-7587b388a29b",
    "name": "Alpha-Carotene",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "503841ae-3685-48c9-80c5-378e14a7111f",
    "name": "Alpha-Tocopherol",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "9fc3090a-2d12-4e13-aa09-f42fbe6f9f1a",
    "name": "Alpha-Tocotrienol",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "d40e7b46-60b7-43d0-ab39-123c000ded4c",
    "name": "Ascorbic Acid",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "01876f70-54d4-41d6-a74c-7ae2248810b8",
    "name": "Beta-Carotene",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "c168d49a-62b3-4a2b-b97f-51c87af789ac",
    "name": "Beta-Cryptoxanthin",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "e11e690a-d1ed-41e4-b135-b44df6c7151d",
    "name": "Beta-Tocopherol",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "1f1607ae-0e0a-4353-90a7-4ed6866f113b",
    "name": "Beta-Tocotrienol",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "ec8bd109-2f6b-44db-a897-dfaff1df3b4c",
    "name": "Biotin (B7)",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "7d146bc2-a958-49dc-bcc7-aabea9739cce",
    "name": "Choline (Total)",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "5d429477-d0b2-4648-a325-dc60bfaaab36",
    "name": "Cyanocobalamin",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "bfbcf712-3fc8-40be-88a1-b261d8e7cc64",
    "name": "Dehydroascorbic Acid",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "255c5891-5cf9-46b0-a012-5d3d5a23961e",
    "name": "Delta-Tocopherol",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "da588509-eced-4580-b336-425eaadcfd83",
    "name": "Delta-Tocotrienol",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "10eddc9f-1003-466c-9efa-2a52d66dd332",
    "name": "Folate (Total)",
    "compound_type": "VITAMIN",
    "unit": "μg DFE",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "e91a4a2f-e689-4f06-90ed-554cf34ca4ee",
    "name": "Folic Acid (Synthetic)",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "643bcfb9-7951-4b4e-82d0-b296ffdecee5",
    "name": "Food Folate (Natural)",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "505d146b-72d2-4e51-b3d2-c836265e3792",
    "name": "Free Choline",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "a9776f7b-4aac-41dd-a2f6-3503fb18ccf9",
    "name": "Gamma-Tocopherol",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "ded5492b-fd90-48f6-ba89-9e2529135c46",
    "name": "Gamma-Tocotrienol",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "a1e7fc05-43b9-4a64-b606-6d4884bb0ef6",
    "name": "Methylcobalamin",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "83747478-2142-4783-a460-56aa0e91f9cd",
    "name": "Niacin (B3)",
    "compound_type": "VITAMIN",
    "unit": "mg NE",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "eb13577d-6674-42ae-bd49-7da3327f739c",
    "name": "Nicotinamide",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "f8009b9f-c6f8-4898-8e70-0af8e0028a9a",
    "name": "Nicotinic Acid",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "81b0bf79-3710-4db4-94f9-71d016d15da8",
    "name": "Pantothenic Acid (B5)",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "4c697c13-40a4-4baa-8546-63406e6d904b",
    "name": "Phosphatidylcholine",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "a732926a-2c10-410a-b926-e4f649355844",
    "name": "Pyridoxal",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "f95a1e64-2287-4eb7-9b22-520e18b12a82",
    "name": "Pyridoxamine",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "d92e189f-5ece-4ee4-a061-d7419abfbbbe",
    "name": "Pyridoxine",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "b0fb57d7-900b-46d9-a42f-1954ea24be9e",
    "name": "Retinal",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "bea30962-817f-4dc9-a326-5df72904418e",
    "name": "Retinol",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "9e237419-b1b0-42aa-b1c2-e9260cdfada9",
    "name": "Riboflavin (B2)",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "352a3f11-c248-41eb-ac4b-3ef46710c6bd",
    "name": "Thiamin (B1)",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "355fad19-33bf-477b-ab18-299c035e4db1",
    "name": "Vitamin A (RAE)",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "ed6686b4-6282-46be-b4a7-50a64a0806e7",
    "name": "Vitamin B12 (Total)",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "d39be862-034f-4dcc-94da-17d8a6d99b97",
    "name": "Vitamin B6",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "2f15a839-4b9f-4a16-80d3-0c21acbc94cd",
    "name": "Vitamin C (Total)",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "441980b1-ad35-4121-963f-dc2f202557b1",
    "name": "Vitamin D (Total)",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "0b9731a0-28b8-4551-8ce4-943c51c7aad5",
    "name": "Vitamin D2 (Ergocalciferol)",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "38e499a3-79c9-4cb6-bff4-f5dceef3b3e7",
    "name": "Vitamin D3 (Cholecalciferol)",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "8fdc24ed-b42e-43df-ace1-bac99e1c76dd",
    "name": "Vitamin E (Total)",
    "compound_type": "VITAMIN",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "2f9e2ca0-d8d2-440b-b54f-8f50bfb3ee4b",
    "name": "Vitamin K (Total)",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "dab73cc0-2331-4427-8ac0-adb14d208100",
    "name": "Vitamin K1 (Phylloquinone)",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "c091962c-888d-462f-a832-b6fdf0a9e5bf",
    "name": "Vitamin K2 MK-4",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "3fc2fb43-c097-4af0-9f46-275c23ecfb9e",
    "name": "Vitamin K2 MK-7",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "458bf654-d16e-4ea4-a5ec-a36e1c58f069",
    "name": "Vitamin K2 MK-9",
    "compound_type": "VITAMIN",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "ad88d8b2-7da2-453f-a54c-bf146cbb53ff",
    "name": "Boron",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "e6efa4c3-a8db-49ee-81e0-850acea63c2e",
    "name": "Calcium",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "6e22a30a-abbb-4238-b01a-7def9644b140",
    "name": "Chloride",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "85a7ac0d-5aca-498a-95e8-5dbdf187f506",
    "name": "Chromium",
    "compound_type": "MINERAL",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "93e2d6b5-47cb-43f1-a4a7-d0fde708ff35",
    "name": "Cobalt",
    "compound_type": "MINERAL",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "361f5c18-6b52-4e2b-b1d6-0783a9109b40",
    "name": "Copper",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "1fa4bc4a-bc96-4b03-bf84-cea68363a66e",
    "name": "Fluoride",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "ba07ab8b-b0c3-4e46-9b1d-ff0f4646f018",
    "name": "Heme Iron",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "5ee4ff8b-16a0-44ab-b733-1a65b19eaa29",
    "name": "Iodine",
    "compound_type": "MINERAL",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "4bd1e6c1-308c-41f2-9f1a-e939b20d1fa9",
    "name": "Iron (Total)",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "ead6e5c8-2fa7-4a4b-872b-a7b70f319edd",
    "name": "Magnesium",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "9a962443-ab19-43de-993e-46e2740d1671",
    "name": "Manganese",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "93e4ba83-719b-429c-87b0-2be9674ea1b1",
    "name": "Molybdenum",
    "compound_type": "MINERAL",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "bc8129a2-5ea1-421f-ba85-ec4b143d977d",
    "name": "Non-Heme Iron",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "71372681-3187-43ea-996b-5f745e9df843",
    "name": "Phosphorus",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "4227ba06-26a3-472e-94db-c7cd275dc820",
    "name": "Potassium",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "9f665acb-f137-4cf9-a1ea-0c0df0fb5f3b",
    "name": "Selenium",
    "compound_type": "MINERAL",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "1a196103-09bf-4315-92d1-30cb19d506e3",
    "name": "Silicon",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "529ee345-fceb-4ed8-91dc-46b3521283c3",
    "name": "Sodium",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "6cefbf01-68c8-43e9-865f-31cfc42a1f56",
    "name": "Sulfur",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "be65e803-d684-418c-b5dc-cff27dadda4a",
    "name": "Zinc",
    "compound_type": "MINERAL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "6d2ef977-0df3-4070-8673-d68290c1cfc8",
    "name": "Alanine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "211f0333-e63f-4db1-8658-b804e550703c",
    "name": "Arginine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "ac0136c6-9176-48f6-8bb3-7a9704ae6780",
    "name": "Asparagine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "4aadc761-4814-4d23-895d-fce03036ccb0",
    "name": "Aspartic Acid",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "89ee6196-7bd7-4dd8-8a94-d36a8224bace",
    "name": "Cysteine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "bd6e9dc7-eee0-4c00-82f4-b88fd018ee56",
    "name": "Glutamic Acid",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "c1564ecc-1cba-4040-9bf5-7457a2742ab8",
    "name": "Glutamine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "a5b051f5-e6c4-40da-94fb-b1c98a27f85d",
    "name": "Glycine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "2be6c1f5-ae69-4c84-a156-635f6e033103",
    "name": "Histidine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "2460c834-cb6e-40f6-b5ba-188fc4ee2e42",
    "name": "Isoleucine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "75307558-8367-405a-ad03-365ead388d65",
    "name": "Leucine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "3262ee55-578f-4f4d-884f-eaaa79cd67b3",
    "name": "Lysine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "eae1bf43-80c3-40e6-add6-0c489f67d19b",
    "name": "Methionine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "0eca354e-7a45-4031-b7d8-ba034295735e",
    "name": "Phenylalanine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "8ad10549-2ab4-4e10-99ea-cd588bef7203",
    "name": "Proline",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "8f84763b-8d1b-4e0e-8d1e-92db3f24794f",
    "name": "Serine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "1208bbe5-87af-436a-a27c-0dbdfa36e53c",
    "name": "Taurine",
    "compound_type": "AMINO_ACID",
    "unit": "mg",
    "parent_compound_id": null,
    "description": "Sulfonic acid amino acid"
  },
  {
    "id": "5f52df7a-2955-4900-bfcf-0f38534b74b5",
    "name": "Threonine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "306f53d5-2688-4116-8288-f4cf052619c9",
    "name": "Tryptophan",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "cb2401ee-17fc-4d18-b7cd-5a629fb08727",
    "name": "Tyrosine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "de98c02e-7d5e-4a6f-899f-743c58eebe6e",
    "name": "Valine",
    "compound_type": "AMINO_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "32902f38-94e5-4e66-97c3-15b24b66ff4b",
    "name": "Adrenic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "e4249559-740f-4d74-9507-fec49e81b4fb",
    "name": "Alpha-Linolenic Acid (ALA)",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "0fe99a91-149d-4b69-b5fe-3308101d0c91",
    "name": "Aluminum",
    "compound_type": "HEAVY_METAL",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "f62aa67d-b3c7-4dc4-87df-50a3f4ed3cb7",
    "name": "Antimony",
    "compound_type": "HEAVY_METAL",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "432ff525-84ad-44c7-8fbf-72b4fd6c9267",
    "name": "Arachidic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "a5d10413-197e-4422-a088-ef4bd922e46c",
    "name": "Arachidonic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "7072849e-f559-4d6e-9f41-ec2466073c43",
    "name": "Arsenic",
    "compound_type": "HEAVY_METAL",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "b62133d4-7895-4e38-8cec-1a9b61438cdf",
    "name": "Behenic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "6f649d9c-c1cc-4346-b60f-26dd05798089",
    "name": "Beta-Glucan",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "977ff650-9bee-4ff5-98f1-7f15217a5a2f",
    "name": "Beta-Sitosterol",
    "compound_type": "STEROL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "3d5e6696-687a-43b4-b5d9-7dd43fa7402d",
    "name": "Butyric Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "f4e773e1-ac5b-4571-aac9-71af22c0453a",
    "name": "Cadmium",
    "compound_type": "HEAVY_METAL",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "6f7f5bac-9fed-4b61-8b88-dc143310808c",
    "name": "Campesterol",
    "compound_type": "STEROL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "e1bc3f3e-1c88-4be7-a8a7-57b4d3f328aa",
    "name": "Capric Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "a6547cf4-6a4c-41b6-aed7-63608911ce7c",
    "name": "Caproic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "73c0c69f-d65b-4a89-8a6b-28c9a939fa41",
    "name": "Caprylic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "1c051e71-125b-4326-8666-e2a8d29f7c0c",
    "name": "Carbohydrates (Excluding Fiber)",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "378b52f2-8ed6-42b3-8091-8fee6d753762",
    "name": "Cholesterol",
    "compound_type": "STEROL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "c8c714ed-f723-4e34-a168-547023b2764b",
    "name": "CLA (Conjugated Linoleic Acid)",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "8f21afa8-b695-4e71-9630-d718b854d211",
    "name": "DHA (Docosahexaenoic Acid)",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "779d1902-594d-4eb8-b597-2702d064bf16",
    "name": "Dietary Fiber",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "2c790200-865f-4f38-b20c-1ab66d8027eb",
    "name": "Dihomo-γ-Linolenic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "5c065744-2244-455d-b33f-5246ac33ec68",
    "name": "Docosapentaenoic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "bd9caf42-eca5-456c-b4e9-e312ca92f131",
    "name": "EPA (Eicosapentaenoic Acid)",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "6db201ee-325e-41f4-8f88-9e34684aeba8",
    "name": "Erucic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "72313869-9949-47f4-a5e3-8f8b6c95d25d",
    "name": "Erythritol",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "6a683634-d2c7-489c-81fa-174ad3b759d0",
    "name": "Fructose",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "7b5602ec-58bf-4250-94d1-65ffea8c34ab",
    "name": "Galactose",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "1adc9be1-333b-4a97-a5e2-49e2077abb2a",
    "name": "Gamma-Linolenic Acid (GLA)",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "87711c7e-941e-4ca0-a9aa-38ec277fcaec",
    "name": "Glucose",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "675b3438-2016-478f-b1c5-c3c1d7ad7530",
    "name": "Insoluble Fiber",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "64578725-8663-489b-a17c-fa2310109810",
    "name": "Inulin",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "36219e8d-974b-4077-8adc-f9e52d58a2e2",
    "name": "Lactose",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "c5682e7e-3c28-4ef7-b3be-89c04c1ac80e",
    "name": "Lauric Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "5da0db38-05b8-4bb6-87bd-6eb7fc2c10fb",
    "name": "Lead",
    "compound_type": "HEAVY_METAL",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "cefcfabe-3d65-4627-9b61-c4863b5760b9",
    "name": "Lignoceric Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "3f451fe7-e4ab-4bd7-a20e-f71536a477db",
    "name": "Linoleic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "c73c692d-a763-457b-ac27-c266d2edb66c",
    "name": "Maltose",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "8bfd0e2b-411c-42c6-bd3b-08ce17839b0f",
    "name": "Mannitol",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "6de2ed27-e816-4896-ac1c-2f6e4c8851e6",
    "name": "Mercury",
    "compound_type": "HEAVY_METAL",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "036f3037-f62d-41f8-9760-32b6a0be1d46",
    "name": "Myristic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "4c05d56d-ced3-4cc2-9e16-ffdc984f0c65",
    "name": "Nickel",
    "compound_type": "HEAVY_METAL",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "9e406cb9-867b-442d-a4be-f232b772dd07",
    "name": "Oleic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "d98d9091-7e42-4da2-85e6-f11fbc936ff7",
    "name": "Palmitic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "7aa8e3e9-4743-4280-babe-9a9c0398b5ff",
    "name": "Palmitoleic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "71cba514-5a39-40ae-b6fe-1cbb8da89433",
    "name": "Pectin",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "922e59da-7a21-44fe-be5e-9c50b4c0a54a",
    "name": "Resistant Starch",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "42bec45c-f30a-4696-9650-6f502172ed46",
    "name": "Soluble Fiber",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "a8d3ced4-8a81-4a41-99f0-fb24a87f89ba",
    "name": "Sorbitol",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "e6930463-0ac8-4ea2-8f27-497434ede670",
    "name": "Starch",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "0b3f9386-a7a3-4a6e-9d9d-f1460bff77dd",
    "name": "Stearic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "d43397f6-0aba-4fcc-a622-2e2816bca79b",
    "name": "Stearidonic Acid",
    "compound_type": "FATTY_ACID",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "d4fa05ac-fb98-41fa-938e-1bce0bb958e8",
    "name": "Stigmasterol",
    "compound_type": "STEROL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "7a7b3b19-9be6-4b92-8a72-2f2a794c8c55",
    "name": "Sucrose",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "f831848d-0072-4d66-aae5-405f976e6845",
    "name": "Tin",
    "compound_type": "HEAVY_METAL",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "cc6910af-4a3c-4c7e-b3de-034c7c64b88c",
    "name": "Total Plant Sterols",
    "compound_type": "STEROL",
    "unit": "mg",
    "parent_compound_id": null,
    "description": "Total phytosterols"
  },
  {
    "id": "48352874-5af8-4173-a8f4-22912bb993f3",
    "name": "Total Sugars",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "5dc22512-c2f2-44bf-bb3e-6bf49c068747",
    "name": "Uranium",
    "compound_type": "HEAVY_METAL",
    "unit": "μg",
    "parent_compound_id": null,
    "description": null
  },
  {
    "id": "bcc3ffd9-9d58-421b-8fe8-cf4fd011b7da",
    "name": "Xylitol",
    "compound_type": "CARBOHYDRATE",
    "unit": "g",
    "parent_compound_id": null,
    "description": null
  }
];

// Export count for verification
export const CORE_COMPOUND_COUNT = 160;

// Group compounds by type for quick access
export const COMPOUNDS_BY_TYPE: Record<string, CoreCompound[]> = CORE_COMPOUNDS.reduce((acc, c) => {
  if (!acc[c.compound_type]) acc[c.compound_type] = [];
  acc[c.compound_type].push(c);
  return acc;
}, {} as Record<string, CoreCompound[]>);
