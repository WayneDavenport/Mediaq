'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { validateCategory, PROTECTED_CATEGORIES } from "@/lib/utils";

const PRESET_CATEGORIES = ['Fun', 'Learning', 'Hobby', 'Productivity', 'General'];

export default function CategorySelectDialog({ isOpen, onClose, onConfirm }) {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [allCategories, setAllCategories] = useState(PRESET_CATEGORIES);
    const [isCustom, setIsCustom] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/media-items/categories');
                const data = await response.json();
                if (data.categories) {
                    const uniqueCategories = Array.from(new Set([...PRESET_CATEGORIES, ...data.categories]));
                    setAllCategories(uniqueCategories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    const handleCustomCategoryAdd = () => {
        const trimmedCategory = customCategory.trim();
        if (!trimmedCategory) return;

        if (!validateCategory(trimmedCategory)) {
            toast.error(
                "Cannot use media type as category", {
                description: "Warning: Naming categories after media types causes unintended paradox. Not recommended unless facing Gozer the Gozerian (Maybe try a variation)"
            });
            return;
        }

        if (!allCategories.includes(trimmedCategory)) {
            setAllCategories(prev => [...prev, trimmedCategory]);
            setSelectedCategory(trimmedCategory);
            setCustomCategory('');
            setIsCustom(false);
        }
    };

    const handleConfirm = () => {
        if (isCustom && customCategory.trim()) {
            handleCustomCategoryAdd();
            onConfirm(customCategory.trim());
        } else if (selectedCategory) {
            onConfirm(selectedCategory);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select a Category</DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-4">
                    <div className="space-y-2">
                        <Label>Choose existing category</Label>
                        <Select
                            value={selectedCategory}
                            onValueChange={(value) => {
                                setSelectedCategory(value);
                                setIsCustom(false);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {allCategories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Or create a new category</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter custom category..."
                                value={customCategory}
                                onChange={(e) => {
                                    setCustomCategory(e.target.value);
                                    setIsCustom(true);
                                    setSelectedCategory('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleConfirm();
                                    }
                                }}
                            />
                            <Button
                                variant="secondary"
                                onClick={handleCustomCategoryAdd}
                                disabled={!customCategory.trim()}
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedCategory && !customCategory.trim()}
                    >
                        Add to Queue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 