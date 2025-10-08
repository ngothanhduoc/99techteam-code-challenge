/**
 * Problem 4: Three ways to sum to n
 * Provides 3 different implementations to calculate sum from 1 to n
 */

import { validateInput, MAX_SAFE_FORMULA_INPUT, MAX_SAFE_RECURSIVE_INPUT, runAllTests } from './utils';

/**
 * Method 1: Using traditional for loop
 * 
 * Time Complexity: O(n) - Must iterate through n elements
 * Space Complexity: O(1) - Only uses sum variable to store result
 * 
 * Advantages:
 * - Easy to understand and intuitive
 * - No overhead from recursive calls
 * - Low memory usage
 * 
 * Disadvantages:
 * - Slow with large n due to n iterations
 * - Doesn't leverage mathematical formula
 */
function sum_to_n_a(n: number): number {
    validateInput(n);
    
    if (n === 0) return 0;
    
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
}

/**
 * Method 2: Using mathematical formula (Arithmetic Series)
 * Formula: n * (n + 1) / 2
 * 
 * Time Complexity: O(1) - Only performs constant calculations
 * Space Complexity: O(1) - No additional memory usage
 * 
 * Advantages:
 * - Extremely fast, independent of n value
 * - Most efficient among the 3 methods
 * - Utilizes mathematical knowledge
 * 
 * Disadvantages:
 * - Requires understanding of mathematical formula
 * - May overflow with very large n (> Number.MAX_SAFE_INTEGER)
 */
function sum_to_n_b(n: number): number {
    validateInput(n, MAX_SAFE_FORMULA_INPUT, 'formula');
    
    if (n === 0) return 0;
    
    return (n * (n + 1)) / 2;
}

/**
 * Method 3: Using recursion
 * 
 * Time Complexity: O(n) - Must make n recursive calls
 * Space Complexity: O(n) - Call stack depth = n
 * 
 * Advantages:
 * - Concise and elegant code
 * - Demonstrates functional programming thinking
 * - Easy to prove correctness using mathematical induction
 * 
 * Disadvantages:
 * - Slowest among the 3 methods due to function call overhead
 * - Uses more memory for call stack
 * - May cause stack overflow with large n (typically > 10000)
 * - Not tail-call optimized in JavaScript
 */
function sum_to_n_c(n: number): number {
    validateInput(n, MAX_SAFE_RECURSIVE_INPUT, 'recursive');
    
    // Base cases
    if (n === 0 || n === 1) return n;
    
    // Recursive case: sum(n) = n + sum(n-1)
    return n + sum_to_n_c(n - 1);
}


// Export functions for external use
export { sum_to_n_a, sum_to_n_b, sum_to_n_c };

// Demo: Uncomment the line below to run comprehensive tests
runAllTests(sum_to_n_a, sum_to_n_b, sum_to_n_c);
