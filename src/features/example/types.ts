/**
 * Example feature — TypeScript types.
 *
 * Keep types here, not in actions.ts.
 * Import from both the service layer and server actions.
 *
 * Copy to src/features/<your-feature>/types.ts and adapt.
 */

export interface ExampleItem {
  id: number;
  title: string;
  completed: boolean;
}

export interface CreateExampleItemDto {
  title: string;
}
