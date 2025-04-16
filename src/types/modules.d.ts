// Allow TypeScript to import components from our custom paths
declare module '@/components/ui/Tabs' {
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
  export { Tabs, TabsContent, TabsList, TabsTrigger };
}

declare module '@/components/ui/Select' {
  import { 
    Select, 
    SelectContent, 
    SelectGroup, 
    SelectItem, 
    SelectLabel, 
    SelectSeparator, 
    SelectTrigger, 
    SelectValue 
  } from '@radix-ui/react-select';
  export { 
    Select, 
    SelectContent, 
    SelectGroup, 
    SelectItem, 
    SelectLabel, 
    SelectSeparator, 
    SelectTrigger, 
    SelectValue 
  };
}

declare module '@/components/ui/Spinner' {
  interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: 'sm' | 'md' | 'lg';
  }
  const Spinner: React.FC<SpinnerProps>;
  export default Spinner;
} 