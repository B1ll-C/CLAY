// app/models/shopping.ts

export type ListItem = {
  id: number;
  name: string;
  isChecked: boolean;
};

export type ShoppingList = {
  id: number;
  title: string;
  list: ListItem[];
  onUpdate?: () => void;
};

export type NoteCardProps = {
  title: string;
  list: { name: string; isChecked: boolean }[];
  onPress?: () => void;
};

// type ShoppingListType = {
//   title: string;
//   list: { name: string; isChecked: boolean }[];
// };
