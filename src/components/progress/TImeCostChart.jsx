"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const formatDuration = (minutes) => {
    if (minutes >= 60) {
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    }
    return `${Math.round(minutes)}m`;
};

const getProgressData = (items, groupBy = 'category') => {
    const groups = items.reduce((acc, item) => {
        const key = item[groupBy]?.toLowerCase() || 'uncategorized';
        if (!acc[key]) {
            acc[key] = {
                name: key.charAt(0).toUpperCase() + key.slice(1),
                totalTime: 0
            };
        }

        if (item.user_media_progress) {
            switch (item.media_type) {
                case 'book':
                    acc[key].totalTime += item.books?.page_count || 0;
                    break;
                case 'tv':
                case 'movie':
                case 'game':
                    acc[key].totalTime += item.user_media_progress.duration || 0;
                    break;
            }
        }

        return acc;
    }, {});

    return Object.values(groups);
};

const TimeCostChart = ({ mediaItems }) => {
    const [localSortOption, setLocalSortOption] = useState("media_type");
    const [showBarChart, setShowBarChart] = useState(false);
    const data = getProgressData(mediaItems, localSortOption);

    const totalTime = data.reduce((sum, item) => sum + item.totalTime, 0);
    const pieData = data.map(item => ({
        name: item.name,
        value: item.totalTime
    }));

    const COLORS = [
        'hsl(var(--chart-1))',
        'hsl(var(--chart-2))',
        'hsl(var(--chart-3))',
        'hsl(var(--chart-4))',
        'hsl(var(--chart-5))'
    ];

    return (
        <Card className="p-4">
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Your Media Time Cost</h2>
                    <p className="text-sm text-muted-foreground">
                        Total Time: {formatDuration(totalTime)}
                    </p>
                </div>

                <div className="flex justify-between items-center gap-4">
                    <Select
                        value={localSortOption}
                        onValueChange={setLocalSortOption}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Group by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="category">Category</SelectItem>
                            <SelectItem value="media_type">Media Type</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center space-x-2">
                        <Label htmlFor="chart-type">Bar Chart</Label>
                        <Switch
                            id="chart-type"
                            checked={showBarChart}
                            onCheckedChange={setShowBarChart}
                        />
                    </div>
                </div>

                <div className="h-[300px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={showBarChart ? 'bar' : 'pie'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                {!showBarChart ? (
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={false}
                                            labelLine={false}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    className="stroke-background"
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name) => [formatDuration(value), name]}
                                        />
                                        <Legend
                                            verticalAlign="middle"
                                            align="right"
                                            layout="vertical"
                                        />
                                    </PieChart>
                                ) : (
                                    <BarChart
                                        data={data}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={formatDuration}
                                        />
                                        <Tooltip
                                            formatter={(value) => [formatDuration(value), 'Total Time']}
                                        />
                                        <Bar
                                            dataKey="totalTime"
                                            fill="hsl(var(--primary))"
                                            radius={[4, 4, 0, 0]}
                                            name="Time Cost"
                                        />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </Card>
    );
};

export default TimeCostChart; 