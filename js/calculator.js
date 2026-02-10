/**
 * CalculatorLogic - Pure formulas for cost calculation.
 */
const Calculator = {
    /**
     * Calculates the cost of the material used.
     * @param {number} weightGrams - Weight of the print in grams.
     * @param {number} costPerKg - Cost of the material per Kg (derived from roll price/weight).
     * @returns {number} Cost in currency.
     */
    calculateMaterialCost: (weightGrams, rollPrice, rollWeight) => {
        if (!weightGrams || !rollPrice || !rollWeight) return 0;
        const costPerGram = rollPrice / rollWeight;
        return weightGrams * costPerGram;
    },

    /**
     * Calculates the total printing time in hours.
     * @param {number} d - Days
     * @param {number} h - Hours
     * @param {number} m - Minutes
     * @returns {number} Total hours (decimal).
     */
    calculateTotalHours: (d = 0, h = 0, m = 0) => {
        return (d * 24) + h + (m / 60);
    },

    /**
     * Calculates energy cost.
     * @param {number} totalHours - Total print time.
     * @param {number} consumptionKw - Printer consumption in kW (e.g., 0.350).
     * @param {number} kwhCost - Cost per kWh.
     * @returns {number} Energy cost.
     */
    calculateEnergyCost: (totalHours, consumptionKw, kwhCost) => {
        return totalHours * consumptionKw * kwhCost;
    },

    /**
     * Calculates depreciation cost per print.
     * Formula: (Printer Price + Maintenance Lifetime Est.) / Total Lifespan Hours * Print Hours
     * Simplified: Depreciation/Hour = (Price * (1 + Maint%)) / LifespanHours
     */
    calculateDepreciation: (totalHours, printerPrice, lifespanHours, maintenancePercent) => {
        if (!lifespanHours || lifespanHours <= 0) return 0;
        // Total cost of ownership for the machine over its life
        const totalMachineCost = printerPrice * (1 + (maintenancePercent / 100));
        const costPerHour = totalMachineCost / lifespanHours;
        return costPerHour * totalHours;
    },

    /**
     * Calculates labor cost.
     * @param {number} hours - Labor hours (post-processing, slicing, etc).
     * @param {number} hourlyRate - Cost per hour.
     */
    calculateLaborCost: (hours, hourlyRate) => {
        return hours * hourlyRate;
    },

    /**
     * Calculates total cost including failure margin.
     * @param {number} subtotal - Sum of material + energy + depreciation + labor.
     * @param {number} failureRatePercent - Percentage of failure risk (adds to cost).
     */
    calculateTotalWithFailures: (subtotal, failureRatePercent) => {
        // If 10% fail rate, we need to charge enough to cover that.
        // Simple method: Add % to cost. 
        // Accurate method: Cost / (1 - rate) -> Higher burden.
        // User spec says: custo_falhas = subtotal * taxa_falhas
        return subtotal + (subtotal * (failureRatePercent / 100));
    },

    /**
     * Calculates final sell price with markup.
     * @param {number} totalCost 
     * @param {number} markupPercent 
     */
    calculateSellPrice: (totalCost, markupPercent) => {
        return totalCost * (1 + (markupPercent / 100));
    }
};
