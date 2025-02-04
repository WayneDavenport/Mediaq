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
    SelectSeparator,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PRESET_CATEGORIES = ['Fun', 'Learning', 'Hobby', 'Productivity', 'General'];

export default function CategorySelectDialog({ isOpen, onClose, onConfirm }) {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [allCategories, setAllCategories] = useState(PRESET_CATEGORIES);

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

    const handleCustomCategoryAdd = (newCategory) => {
        if (newCategory && !allCategories.includes(newCategory)) {
            setAllCategories(prevCategories => [...prevCategories, newCategory]);
            setSelectedCategory(newCategory);
            setCustomCategory('');
        }
    };

    const handleConfirm = () => {
        if (!selectedCategory) return;
        onConfirm(selectedCategory);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select a Category</DialogTitle>
                </DialogHeader>
                <div className="py-6">
                    <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select or enter a category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {allCategories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectGroup>

                            <SelectSeparator />

                            <div className="p-2">
                                <Input
                                    placeholder="Enter custom category..."
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleCustomCategoryAdd(customCategory.trim());
                                        }
                                    }}
                                />
                            </div>
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedCategory}
                    >
                        Add to Queue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 