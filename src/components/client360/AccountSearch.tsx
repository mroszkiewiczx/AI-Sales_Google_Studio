import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAccountSearch } from "@/hooks/useClient360";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function AccountSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: accounts, isLoading } = useAccountSearch(searchTerm);
  const navigate = useNavigate();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10 text-muted-foreground font-normal"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Szukaj klienta...
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[368px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Wpisz nazwę firmy..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>Nie znaleziono klienta.</CommandEmpty>
                <CommandGroup>
                  {accounts?.map((account: any) => (
                    <CommandItem
                      key={account.id}
                      value={account.name}
                      onSelect={() => {
                        navigate(`/client360/${account.id}`);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{account.name}</span>
                        <span className="text-[10px] text-muted-foreground">{account.domain}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
