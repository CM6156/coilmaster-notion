
import { format } from 'date-fns';

export enum BlockType {
  TEXT = 'text',
  IMAGE = 'image',
  TABLE = 'table',
  CODE = 'code',
  FILE = 'file'
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
}

export const generateId = () => {
  // Generate a random id
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const getFormattedDate = (date: string | Date) => {
  try {
    return format(new Date(date), 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

export const validateBlockType = (type: string) => {
  return Object.values(BlockType).includes(type as BlockType);
};
