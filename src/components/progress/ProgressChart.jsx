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
                totalDuration: 0,
                completedDuration: 0
            };
        }

        if (item.user_media_progress) {
            switch (item.media_type) {
                case 'book':
                    acc[key].totalDuration += item.books?.page_count || 0;
                    acc[key].completedDuration += item.user_media_progress.pages_completed || 0;
                    break;
                case 'tv':
                case 'movie':
                case 'game':
                    acc[key].totalDuration += item.user_media_progress.duration || 0;
                    acc[key].completedDuration += item.user_media_progress.completed_duration || 0;
                    break;
            }
        }

        return acc;
    }, {});

    return Object.values(groups).map(group => ({
        ...group,
        progressPercentage: group.totalDuration > 0
            ? (group.completedDuration / group.totalDuration) * 100
            : 0
    }));
};

const ProgressChart = ({ mediaItems }) => {
    const [localSortOption, setLocalSortOption] = useState("category");
    const [showBarChart, setShowBarChart] = useState(false);
    const data = getProgressData(mediaItems, localSortOption);

    const pieData = data.map(item => ({
        name: item.name,
        value: item.progressPercentage,
        rawProgress: item.completedDuration,
        rawTotal: item.totalDuration
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
                    <h2 className="text-lg font-semibold">Progress Overview</h2>
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
                        <Label htmlFor="progress-chart-type">Show as Bar Chart</Label>
                        <Switch
                            id="progress-chart-type"
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
                                            formatter={(value, name, props) => [
                                                `${Math.round(value)}% (${formatDuration(props.payload.rawProgress)} / ${formatDuration(props.payload.rawTotal)})`,
                                                name
                                            ]}
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
                                            tickFormatter={(value) => `${Math.round(value)}%`}
                                        />
                                        <Tooltip
                                            formatter={(value, name) => [`${Math.round(value)}%`, 'Progress']}
                                        />
                                        <Bar
                                            dataKey="progressPercentage"
                                            fill="hsl(var(--primary))"
                                            radius={[4, 4, 0, 0]}
                                            name="Progress"
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

export default ProgressChart; 