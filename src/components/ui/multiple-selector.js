'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandEmpty,
    CommandList,
} from '@/components/ui/command';
import { Command as CommandPrimitive } from 'cmdk';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { useOutsideClick } from "@/hooks/use-outside-click";

const MultipleSelector = React.forwardRef(
    ({
        options = [],
        selected = [],
        onChange,
        placeholder = "Select...",
        ...props
    }, ref) => {
        const inputRef = React.useRef(null);
        const containerRef = React.useRef(null);
        const [open, setOpen] = React.useState(false);
        const [inputValue, setInputValue] = React.useState('');
        const [selectedValues, setSelectedValues] = React.useState(selected);

        useOutsideClick(containerRef, () => {
            setOpen(false);
            setInputValue('');
        });

        const handleUnselect = React.useCallback((option) => {
            const newSelectedValues = selectedValues.filter(
                (value) => value.value !== option.value
            );
            setSelectedValues(newSelectedValues);
            onChange?.(newSelectedValues);
        }, [selectedValues, onChange]);

        const handleKeyDown = React.useCallback((e) => {
            const input = inputRef.current;
            if (input) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    if (input.value === '' && selectedValues.length > 0) {
                        const newSelectedValues = [...selectedValues];
                        newSelectedValues.pop();
                        setSelectedValues(newSelectedValues);
                        onChange?.(newSelectedValues);
                    }
                }
                if (e.key === 'Escape') {
                    input.blur();
                }
            }
        }, [selectedValues, onChange]);

        const filteredOptions = React.useMemo(() => {
            return options.filter(option =>
                option.label.toLowerCase().includes(inputValue.toLowerCase()) &&
                !selectedValues.some(selected => selected.value === option.value)
            );
        }, [options, selectedValues, inputValue]);

        return (
            <Command className="overflow-visible bg-transparent" ref={containerRef}>
                <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <div className="flex flex-wrap gap-1">
                        {selectedValues.map((option) => (
                            <Badge
                                key={option.value}
                                variant="secondary"
                                className="hover:bg-secondary/80"
                            >
                                {option.label}
                                <button
                                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleUnselect(option);
                                    }}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                            </Badge>
                        ))}
                        <input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onFocus={() => setOpen(true)}
                            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                            placeholder={placeholder}
                        />
                    </div>
                </div>
                {open && (
                    <div className="relative mt-2">
                        <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                            <CommandList>
                                {filteredOptions.length === 0 ? (
                                    <CommandEmpty>No results found.</CommandEmpty>
                                ) : (
                                    <CommandGroup>
                                        {filteredOptions.map((option) => (
                                            <CommandItem
                                                key={option.value}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    const newSelectedValues = [...selectedValues, option];
                                                    setSelectedValues(newSelectedValues);
                                                    onChange?.(newSelectedValues);
                                                    setInputValue('');
                                                }}
                                                className="cursor-pointer"
                                            >
                                                {option.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </div>
                    </div>
                )}
            </Command>
        );
    }
);

MultipleSelector.displayName = 'MultipleSelector';

export { MultipleSelector }; 