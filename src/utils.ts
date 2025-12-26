export function binarySearch<T>(arr: T[], target: T, cmp:(a: T, b: T) => number, start = 0, end = arr.length - 1) {
  while(start <= end) {
    let mid = Math.floor((start + end) / 2)
    let result = cmp(arr[mid], target)
    if (result === 0) {
      return mid
    } else if (result > 0) {
      end = mid - 1
    } else {
      start = mid + 1
    }
  }
  return start
}