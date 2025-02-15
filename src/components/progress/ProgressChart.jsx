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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

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
                queued: 0,
                completed: 0
            };
        }

        let itemDuration = 0;
        let itemCompleted = 0;

        if (item.user_media_progress) {
            switch (item.media_type) {
                case 'book':
                    itemDuration = item.books?.page_count || 0;
                    itemCompleted = item.user_media_progress.pages_completed || 0;
                    break;
                case 'tv':
                case 'movie':
                case 'game':
                    itemDuration = item.user_media_progress.duration || 0;
                    itemCompleted = item.user_media_progress.completed_duration || 0;
                    break;
            }
        }

        acc[key].queued += itemDuration;
        acc[key].completed += itemCompleted;

        return acc;
    }, {});

    return Object.values(groups);
};

const ProgressChart = ({ mediaItems, sortOption: parentSortOption }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [localSortOption, setLocalSortOption] = useState("category");
    const data = getProgressData(mediaItems, localSortOption);

    const totalQueued = data.reduce((sum, item) => sum + item.queued, 0);
    const pieData = data.map(item => ({
        name: item.name,
        value: item.queued,
        completed: item.completed
    }));

    const COLORS = [
        'hsl(var(--chart-1))', // salmon red
        'hsl(var(--chart-2))', // teal
        'hsl(var(--chart-3))', // dark blue
        'hsl(var(--chart-4))', // yellow
        'hsl(var(--chart-5))'  // orange
    ];

    return (
        <>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[50]"
                        onClick={() => setIsExpanded(false)}
                    />
                )}
            </AnimatePresence>

            <motion.div
                layoutId="progress-chart"
                onClick={() => !isExpanded && setIsExpanded(true)}
                style={{
                    width: isExpanded ? '800px' : '100%',
                    maxHeight: isExpanded ? '85vh' : 'auto',
                    zIndex: isExpanded ? 51 : 'auto'
                }}
            >
                <Card className={`p-4 h-full ${isExpanded ? 'overflow-y-auto' : ''}`}>
                    <motion.div layoutId="progress-chart-content" className="h-full flex flex-col">
                        <motion.div layoutId="progress-chart-header" className="flex flex-col mb-4">
                            <h2 className="text-lg font-semibold">
                                Progress Overview
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Total Duration: {formatDuration(totalQueued)}
                            </p>
                            {isExpanded && (
                                <RadioGroup
                                    value={localSortOption}
                                    onValueChange={setLocalSortOption}
                                    className="flex space-x-4 mt-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="category" id="category" />
                                        <Label htmlFor="category">Category</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="media_type" id="media_type" />
                                        <Label htmlFor="media_type">Media Type</Label>
                                    </div>
                                </RadioGroup>
                            )}
                        </motion.div>

                        <motion.div
                            layoutId="progress-chart-body"
                            className="flex-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {!isExpanded ? (
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
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
                                                startAngle={90}
                                                endAngle={-270}
                                                animationBegin={0}
                                                animationDuration={1500}
                                                animationEasing="ease-out"
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
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--background))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '0.5rem',
                                                    color: 'hsl(var(--foreground))',
                                                    fontWeight: 500
                                                }}
                                                itemStyle={{
                                                    color: 'hsl(var(--foreground))',
                                                    fontWeight: 500
                                                }}
                                                labelStyle={{
                                                    color: 'hsl(var(--foreground))',
                                                    fontWeight: 600
                                                }}
                                            />
                                            <Legend
                                                verticalAlign="middle"
                                                align="right"
                                                layout="vertical"
                                                wrapperStyle={{
                                                    paddingLeft: '2rem'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-full">
                                    <ResponsiveContainer width="100%" height="100%">
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
                                                formatter={(value) => [formatDuration(value), 'Duration']}
                                            />
                                            <Bar
                                                dataKey="queued"
                                                fill="hsl(var(--primary))"
                                                radius={[4, 4, 0, 0]}
                                                name="Time Queued"
                                            />
                                            <Bar
                                                dataKey="completed"
                                                fill="hsl(var(--primary-foreground))"
                                                radius={[4, 4, 0, 0]}
                                                name="Time Completed"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </Card>
            </motion.div>
        </>
    );
};

export default ProgressChart; 