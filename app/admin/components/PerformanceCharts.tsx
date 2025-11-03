// signature-trader/app/admin/components/PerformanceCharts.tsx
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Loader2, TrendingUp, DollarSign, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

// Placeholder Interface
interface ChartData {
    name: string; // Product Name or Category Name
    sales: number;
    units: number;
}

// Custom colors that align with the Shadcn/Tailwind palette
const CHART_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#64748b'];

export default function PerformanceCharts() {
    const [topCategories, setTopCategories] = useState<ChartData[]>([]);
    const [topProducts, setTopProducts] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);

    const getStartDate = () => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString();
    };

    // --- Data Aggregation Logic ---
    useEffect(() => {
        setLoading(true);
        const startDate = getStartDate();
        
        // This query fetches all orders placed in the last 30 days
        const ordersQuery = query(
            collection(db, 'orders'),
            where('created_at', '>=', { seconds: new Date(startDate).getTime() / 1000, nanoseconds: 0 })
        );
        
        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const categoryMap: { [key: string]: { sales: number, units: number } } = {};
            const productMap: { [key: string]: { sales: number, units: number } } = {};
            
            // Iterate over all orders in the 30-day snapshot
            snapshot.docs.forEach(doc => {
                const orderData = doc.data();
                
                // Assuming orders store items array: [{ product_id, category_id, name, price, quantity }]
                const items = orderData.items || [];

                items.forEach((item: any) => {
                    const { category_id, name, price, quantity } = item;
                    const totalSales = (price || 0) * (quantity || 0);

                    // Aggregate by Category
                    const catName = category_id || 'Uncategorized';
                    categoryMap[catName] = {
                        sales: (categoryMap[catName]?.sales || 0) + totalSales,
                        units: (categoryMap[catName]?.units || 0) + (quantity || 0),
                    };
                    
                    // Aggregate by Product
                    const prodName = name || 'Unnamed Product';
                    productMap[prodName] = {
                        sales: (productMap[prodName]?.sales || 0) + totalSales,
                        units: (productMap[prodName]?.units || 0) + (quantity || 0),
                    };
                });
            });

            // Convert maps to chart arrays and sort (Top 5)
            const aggregatedCategories = Object.keys(categoryMap).map(key => ({
                name: key,
                sales: Math.round(categoryMap[key].sales),
                units: categoryMap[key].units,
            })).sort((a, b) => b.sales - a.sales).slice(0, 5); 

            const aggregatedProducts = Object.keys(productMap).map(key => ({
                name: key,
                sales: Math.round(productMap[key].sales),
                units: productMap[key].units,
            })).sort((a, b) => b.sales - a.sales).slice(0, 5);


            setTopCategories(aggregatedCategories);
            setTopProducts(aggregatedProducts);
            setLoading(false);
            
        }, (error) => {
            console.error("Chart data fetch failed:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Loader State
    if (loading) {
        return (
            <div className="text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-500" />
                <p className="text-muted-foreground mt-2">Aggregating 30-day performance data...</p>
            </div>
        );
    }
    
    // Chart Utility Component (Styled with Shadcn principles)
    const ChartContainer = ({ data, title, primaryKey, secondaryKey }: { data: ChartData[], title: string, primaryKey: string, secondaryKey: string }) => (
        <div className="mt-8 border border-border bg-card p-6 rounded-xl shadow-lg h-[400px]">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-semibold text-foreground">
                    {title} (Last 30 Days)
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" /> Sales
                    </span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" /> Units
                    </span>
                </div>
            </div>
            {data.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                    No sales data available for the last 30 days.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        {/* Shadcn style grid and axis */}
                        <CartesianGrid stroke={cn("var(--border)")} strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke={cn("var(--muted-foreground)")} />
                        <YAxis yAxisId="sales" orientation="left" stroke="#ffce00" /> {/* Primary color for Sales */}
                        <YAxis yAxisId="units" orientation="right" stroke="#ef4444" /> {/* Red color for Units */}
                        
                        <Tooltip 
                            contentStyle={{ 
                                borderRadius: 8, 
                                fontSize: 14, 
                                background: 'var(--card)', 
                                border: '1px solid var(--border)' 
                            }} 
                        />
                        <Legend formatter={(value) => {
                            if (value === 'sales') return primaryKey;
                            if (value === 'units') return secondaryKey;
                            return value;
                        }} />
                        
                        <Bar 
                            yAxisId="sales" 
                            dataKey="sales" 
                            name="sales"
                            fill="#ffce00" 
                        />
                        <Bar 
                            yAxisId="units" 
                            dataKey="units" 
                            name="units"
                            fill="#ef4444" 
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );

    return (
        <div className="space-y-12">
            <h2 className="text-3xl font-bold text-red-600 flex items-center gap-2">
                <TrendingUp className='w-6 h-6'/> Monthly Performance Charts
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Categories Chart */}
                <ChartContainer 
                    data={topCategories} 
                    title="Top 5 Categories" 
                    primaryKey="Sales (PKR)"
                    secondaryKey="Units Sold"
                />
                
                {/* Products Chart */}
                <ChartContainer 
                    data={topProducts} 
                    title="Top 5 Products" 
                    primaryKey="Sales (PKR)"
                    secondaryKey="Units Sold"
                />
            </div>
        </div>
    );
}