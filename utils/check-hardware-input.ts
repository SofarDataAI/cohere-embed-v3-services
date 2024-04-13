import { Cpu, Memory } from '@aws-cdk/aws-apprunner-alpha';

/**
 * Parses a string to a Cpu enum value.
 *
 * @param cpuType The CPU type as a string.
 * @returns The corresponding Cpu enum value.
 */
export function parseCpuType(cpuType: string): Cpu {
    switch (cpuType) {
        case 'ONE_VCPU':
            return Cpu.ONE_VCPU;
        case 'TWO_VCPU':
            return Cpu.TWO_VCPU;
        case 'FOUR_VCPU':
            return Cpu.FOUR_VCPU;
        case 'QUARTER_VCPU':
            return Cpu.QUARTER_VCPU;
        case 'HALF_VCPU':
            return Cpu.HALF_VCPU;
        default:
            throw new Error('Invalid CPU type');
    }
}

/**
 * Parses a string to a Memory enum value.
 *
 * @param memoryType The memory type as a string.
 * @returns The corresponding Memory enum value.
 */
export function parseMemoryType(memoryType: string): Memory {
    switch (memoryType) {
        case 'TWO_GB':
            return Memory.TWO_GB;
        case 'FOUR_GB':
            return Memory.FOUR_GB;
        case 'SIX_GB':
            return Memory.SIX_GB;
        case 'EIGHT_GB':
            return Memory.EIGHT_GB;
        case 'TWELVE_GB':
            return Memory.TWELVE_GB;
        case 'HALF_GB':
            return Memory.HALF_GB;
        case 'ONE_GB':
            return Memory.ONE_GB;
        case 'THREE_GB':
            return Memory.THREE_GB;
        default:
            throw new Error('Invalid memory type');
    }
}
