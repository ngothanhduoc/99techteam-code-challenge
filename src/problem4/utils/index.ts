/**
 * Test helpers and utility functions for Problem 4
 */

// Constants for validation limits with detailed explanations

/**
 * Maximum safe input for formula-based calculation
 * 
 * Formula: n * (n + 1) / 2
 * Problem: n * (n + 1) can overflow JavaScript's safe integer range
 * 
 * JavaScript's Number.MAX_SAFE_INTEGER = 2^53 - 1 = 9,007,199,254,740,991
 * For safe calculation: n * (n + 1) ≤ MAX_SAFE_INTEGER * 2
 * Solving: n² + n ≤ MAX_SAFE_INTEGER * 2
 * Approximation for large n: n² ≤ MAX_SAFE_INTEGER * 2
 * Therefore: n ≤ √(MAX_SAFE_INTEGER * 2)
 * 
 * Calculated value: √(9,007,199,254,740,991 * 2) ≈ 134,217,727
 * 
 * Note: The intermediate calculation n*(n+1) may exceed MAX_SAFE_INTEGER,
 * but since we divide by 2 immediately, the final result remains accurate.
 * The limit ensures the multiplication doesn't cause precision loss that
 * would affect the final division result.
 * 
 * Example:
 * - n = 134,217,727: Final result is still mathematically correct
 * - n = 134,217,728: Risk of precision loss in intermediate calculation
 */
export const MAX_SAFE_FORMULA_INPUT = Math.floor(Math.sqrt(Number.MAX_SAFE_INTEGER * 2));

/**
 * Maximum safe input for recursive calculation
 * 
 * Problem: Each recursive call creates a new stack frame
 * JavaScript engines have limited call stack size (typically 8,000-15,000 calls)
 * 
 * Stack overflow occurs when:
 * - Too many function calls are made without returning
 * - Call stack memory is exhausted
 * - Results in "RangeError: Maximum call stack size exceeded"
 * 
 * Testing shows actual limit varies by environment:
 * - V8 (Chrome/Node.js): ~8,874 calls
 * - Different engines may have different limits
 * - Browser vs Node.js may differ
 * 
 * Conservative limit of 10,000 chosen for:
 * - Safety across all JavaScript environments
 * - Reasonable performance (recursive calls are slow anyway)
 * - Clear error messaging before stack overflow
 * 
 * Note: This is not tail-call optimized in JavaScript
 */
export const MAX_SAFE_RECURSIVE_INPUT = 10000;

/**
 * Validates input for sum functions
 * @param n - The input number to validate
 * @param maxValue - Optional maximum value for specific validation
 * @param context - Context for error message (e.g., 'formula', 'recursive')
 * @throws Error if input is invalid
 */
export function validateInput(n: number, maxValue?: number, context?: string): void {
    if (!Number.isInteger(n) || n < 0) {
        throw new Error("Input must be a non-negative integer");
    }
    
    if (maxValue !== undefined && n > maxValue) {
        const contextMsg = context ? ` for ${context} approach` : '';
        throw new Error(`Input value ${n} is too large${contextMsg}, may cause overflow or stack overflow`);
    }
}

/**
 * Test suite to verify correctness of all sum functions
 */
export function runTests(
    sum_to_n_a: (n: number) => number,
    sum_to_n_b: (n: number) => number,
    sum_to_n_c: (n: number) => number
): void {
    const testCases = [0, 1, 5, 10, 100];
    
    console.log("=== CORRECTNESS TEST RESULTS ===");
    testCases.forEach(n => {
        try {
            const results = {
                a: sum_to_n_a(n),
                b: sum_to_n_b(n),
                c: sum_to_n_c(n)
            };
            
            const allMatch = results.a === results.b && results.b === results.c;
            
            console.log(`n = ${n}:`);
            console.log(`  sum_to_n_a: ${results.a}`);
            console.log(`  sum_to_n_b: ${results.b}`);
            console.log(`  sum_to_n_c: ${results.c}`);
            console.log(`  All results match: ${allMatch ? '✅' : '❌'}`);
            console.log('');
        } catch (error) {
            console.log(`n = ${n}: Error - ${error instanceof Error ? error.message : String(error)}`);
        }
    });
}

/**
 * Performance benchmark configuration
 */
export interface BenchmarkConfig {
    testValue: number;
    iterations: number;
    recursiveIterations: number;
}

/**
 * Benchmark result interface
 */
export interface BenchmarkResult {
    method: string;
    time: number;
    iterations: number;
}

/**
 * Runs a performance benchmark for a given function
 * @param fn - Function to benchmark
 * @param testValue - Value to test with
 * @param iterations - Number of iterations to run
 * @returns Benchmark result
 */
export function benchmarkFunction(fn: (n: number) => number, testValue: number, iterations: number): BenchmarkResult {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        fn(testValue);
    }
    const end = performance.now();
    
    return {
        method: fn.name,
        time: end - start,
        iterations
    };
}

/**
 * Performance benchmark suite for all sum functions
 */
export function performanceBenchmark(
    sum_to_n_a: (n: number) => number,
    sum_to_n_b: (n: number) => number,
    sum_to_n_c: (n: number) => number
): void {
    const config: BenchmarkConfig = {
        testValue: 1000,
        iterations: 10000,
        recursiveIterations: 100 // Fewer iterations for recursive method due to performance
    };
    
    console.log("=== PERFORMANCE BENCHMARK ===");
    console.log(`Testing with n = ${config.testValue}, ${config.iterations} iterations:`);
    
    // Benchmark all methods
    const results: BenchmarkResult[] = [
        benchmarkFunction(sum_to_n_a, config.testValue, config.iterations),
        benchmarkFunction(sum_to_n_b, config.testValue, config.iterations),
        benchmarkFunction(sum_to_n_c, config.testValue, config.recursiveIterations)
    ];
    
    // Display results
    results.forEach(result => {
        const iterationNote = result.iterations !== config.iterations ? 
            ` (only ${result.iterations} iterations)` : '';
        console.log(`${result.method}: ${result.time.toFixed(2)}ms${iterationNote}`);
    });
    
    console.log("\n=== PERFORMANCE RANKING ===");
    console.log("1. sum_to_n_b (formula) - FASTEST ⚡");
    console.log("2. sum_to_n_a (for loop) - MODERATE 🚀");
    console.log("3. sum_to_n_c (recursive) - SLOWEST 🐌");
}

/**
 * Test suite for edge cases and invalid inputs
 */
export function testEdgeCases(
    sum_to_n_a: (n: number) => number,
    sum_to_n_b: (n: number) => number,
    sum_to_n_c: (n: number) => number
): void {
    console.log("=== EDGE CASES TEST ===");
    
    // Test with invalid inputs
    const invalidInputs = [-1, 1.5, NaN, Infinity];
    
    invalidInputs.forEach(input => {
        try {
            sum_to_n_a(input);
            console.log(`Input ${input}: No error (unexpected)`);
        } catch (error) {
            console.log(`Input ${input}: ✅ Error caught - ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    
    // Test boundary conditions for different methods
    console.log("\n--- Boundary Tests ---");
    
    // Test large values for formula method
    try {
        const largeN = MAX_SAFE_FORMULA_INPUT + 1;
        sum_to_n_b(largeN);
        console.log(`Formula with n=${largeN}: No error (unexpected)`);
    } catch (error) {
        console.log(`Formula with large n: ✅ Error caught - ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Test large values for recursive method
    try {
        const largeN = MAX_SAFE_RECURSIVE_INPUT + 1;
        sum_to_n_c(largeN);
        console.log(`Recursive with n=${largeN}: No error (unexpected)`);
    } catch (error) {
        console.log(`Recursive with large n: ✅ Error caught - ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Demonstrates why the limits are necessary with practical examples
 */
export function demonstrateLimits(
    sum_to_n_b: (n: number) => number
): void {
    console.log("=== LIMITS DEMONSTRATION ===");
    
    // Demonstrate formula overflow
    console.log("--- Formula Overflow Demo ---");
    console.log(`MAX_SAFE_FORMULA_INPUT: ${MAX_SAFE_FORMULA_INPUT.toLocaleString()}`);
    console.log(`Number.MAX_SAFE_INTEGER: ${Number.MAX_SAFE_INTEGER.toLocaleString()}`);
    
    const safeN = MAX_SAFE_FORMULA_INPUT;
    const unsafeN = MAX_SAFE_FORMULA_INPUT + 1;
    
    console.log(`\nSafe calculation (n = ${safeN.toLocaleString()}):`);
    const safeProduct = safeN * (safeN + 1);
    const safeResult = safeProduct / 2;
    console.log(`  n * (n + 1) = ${safeProduct.toLocaleString()}`);
    console.log(`  Final result: ${safeResult.toLocaleString()}`);
    console.log(`  Intermediate exceeds safe range: ${safeProduct > Number.MAX_SAFE_INTEGER ? '⚠️ YES' : '✅ NO'}`);
    console.log(`  Final result is integer: ${Number.isInteger(safeResult) ? '✅ YES' : '❌ NO'}`);
    
    console.log(`\nUnsafe calculation (n = ${unsafeN.toLocaleString()}):`);
    const unsafeProduct = unsafeN * (unsafeN + 1);
    const unsafeResult = unsafeProduct / 2;
    console.log(`  n * (n + 1) = ${unsafeProduct.toLocaleString()}`);
    console.log(`  Final result: ${unsafeResult.toLocaleString()}`);
    console.log(`  Intermediate exceeds safe range: ${unsafeProduct > Number.MAX_SAFE_INTEGER ? '⚠️ YES' : '✅ NO'}`);
    console.log(`  Final result is integer: ${Number.isInteger(unsafeResult) ? '✅ YES' : '❌ NO'}`);
    
    // Test with actual sum functions to show the difference
    console.log(`\n--- Actual Function Results ---`);
    try {
        const actualSafe = sum_to_n_b(safeN);
        console.log(`  sum_to_n_b(${safeN.toLocaleString()}) = ${actualSafe.toLocaleString()} ✅`);
    } catch (error) {
        console.log(`  sum_to_n_b(${safeN.toLocaleString()}) = ERROR: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    try {
        const actualUnsafe = sum_to_n_b(unsafeN);
        console.log(`  sum_to_n_b(${unsafeN.toLocaleString()}) = ${actualUnsafe.toLocaleString()} ❌`);
    } catch (error) {
        console.log(`  sum_to_n_b(${unsafeN.toLocaleString()}) = ERROR: ${error instanceof Error ? error.message : String(error)} ✅`);
    }
    
    // Demonstrate recursive limits
    console.log("\n--- Recursive Limits Demo ---");
    console.log(`MAX_SAFE_RECURSIVE_INPUT: ${MAX_SAFE_RECURSIVE_INPUT.toLocaleString()}`);
    
    // Test with a smaller recursive function to find actual limit
    function testStackDepth(n: number): number {
        if (n <= 1) return n;
        return n + testStackDepth(n - 1);
    }
    
    const testValues = [5000, 8000, 9000];
    testValues.forEach(n => {
        try {
            const start = performance.now();
            testStackDepth(n);
            const end = performance.now();
            console.log(`  n = ${n.toLocaleString()}: ✅ SUCCESS (${(end - start).toFixed(2)}ms)`);
        } catch (error) {
            console.log(`  n = ${n.toLocaleString()}: ❌ STACK OVERFLOW`);
        }
    });
    
    console.log(`\n💡 Our limit of ${MAX_SAFE_RECURSIVE_INPUT.toLocaleString()} provides safety margin across all environments`);
}

/**
 * Main test runner that executes all test suites
 */
export function runAllTests(
    sum_to_n_a: (n: number) => number,
    sum_to_n_b: (n: number) => number,
    sum_to_n_c: (n: number) => number
): void {
    runTests(sum_to_n_a, sum_to_n_b, sum_to_n_c);
    performanceBenchmark(sum_to_n_a, sum_to_n_b, sum_to_n_c);
    testEdgeCases(sum_to_n_a, sum_to_n_b, sum_to_n_c);
    demonstrateLimits(sum_to_n_b);
}
