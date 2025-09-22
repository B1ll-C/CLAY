// app/models/shopping.ts

export type ListItem = {
  id: number;
  item: string;
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
  list: { item: string; isChecked: boolean }[];
  onPress?: () => void;
  onLongPress?: () => void;
};

// type ShoppingListType = {
//   title: string;
//   list: { name: string; isChecked: boolean }[];
// };
