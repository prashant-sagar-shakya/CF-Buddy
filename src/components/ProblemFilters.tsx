import React, { useEffect, useState } from "react"; // Ensured useState is imported
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"; // Added Input import
import { FilterOptions } from "@/types/codeforces";
import { X } from "lucide-react";

// Constants for rating (moved to top)
const MIN_RATING_GLOBAL = 800;
const MAX_RATING_GLOBAL = 3500;
const RATING_STEP = 100;
const DEFAULT_MIN_RATING = MIN_RATING_GLOBAL;
const DEFAULT_MAX_RATING = MAX_RATING_GLOBAL;

// Props interface (consolidated from the more complete version)
interface ProblemFiltersProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  availableTags: string[];
}

// Simple debounce hook/function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// Helper function to get rating CSS class (standalone)
// Ensure these CSS classes (e.g., .rating-easy) are defined in your global CSS
// Example: .rating-easy { @apply text-green-600 dark:text-green-400; } etc.
const getRatingClass = (rating: number | undefined) => {
  if (rating === undefined) return "text-muted-foreground";
  if (rating < 1200) return "rating-easy";
  if (rating < 1900) return "rating-medium";
  if (rating < 2400) return "rating-hard";
  return "rating-expert";
};

const ProblemFilters: React.FC<ProblemFiltersProps> = ({
  filters,
  setFilters,
  availableTags,
}) => {
  const [localMinRating, setLocalMinRating] = useState(filters.minRating);
  const [localMaxRating, setLocalMaxRating] = useState(filters.maxRating);

  const debouncedMinRating = useDebounce(localMinRating, 300);
  const debouncedMaxRating = useDebounce(localMaxRating, 300);

  useEffect(() => {
    // Update parent filters when debounced local ratings change
    // Only update if values have actually changed to prevent potential loops
    if (
      debouncedMinRating !== filters.minRating ||
      debouncedMaxRating !== filters.maxRating
    ) {
      setFilters((prev) => ({
        ...prev,
        minRating: debouncedMinRating,
        maxRating: debouncedMaxRating,
      }));
    }
  }, [
    debouncedMinRating,
    debouncedMaxRating,
    setFilters,
    filters.minRating,
    filters.maxRating,
  ]);

  useEffect(() => {
    // Sync local state if filters prop changes from parent
    // This handles external changes to filters or initial prop values
    if (filters.minRating !== localMinRating) {
      setLocalMinRating(filters.minRating);
    }
    if (filters.maxRating !== localMaxRating) {
      setLocalMaxRating(filters.maxRating);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.minRating, filters.maxRating]); // Dependencies are filters from props

  const handleSliderChange = (values: number[]) => {
    if (values.length === 2) {
      setLocalMinRating(values[0]);
      setLocalMaxRating(values[1]);
    }
  };

  const handleRatingInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "min" | "max"
  ) => {
    const rawValue = e.target.value;
    if (rawValue === "") {
      // Temporarily set to global min/max if field is cleared, blur will finalize
      if (type === "min") setLocalMinRating(MIN_RATING_GLOBAL);
      else setLocalMaxRating(MAX_RATING_GLOBAL);
      return;
    }
    let newValue = parseInt(rawValue, 10);

    if (isNaN(newValue)) {
      // If input is not a number, do nothing, blur will correct
      return;
    }
    // Clamp the value while typing
    newValue = Math.max(
      MIN_RATING_GLOBAL,
      Math.min(newValue, MAX_RATING_GLOBAL)
    );

    if (type === "min") {
      setLocalMinRating(newValue);
    } else {
      // type === "max"
      setLocalMaxRating(newValue);
    }
  };

  const validateAndSetRatingOnBlur = (type: "min" | "max") => {
    let currentMin = Number(localMinRating);
    let currentMax = Number(localMaxRating);

    // Ensure inputs are valid numbers, falling back to defaults
    if (isNaN(currentMin)) currentMin = DEFAULT_MIN_RATING;
    if (isNaN(currentMax)) currentMax = DEFAULT_MAX_RATING;

    // Clamp to global range
    currentMin = Math.max(
      MIN_RATING_GLOBAL,
      Math.min(currentMin, MAX_RATING_GLOBAL)
    );
    currentMax = Math.max(
      MIN_RATING_GLOBAL,
      Math.min(currentMax, MAX_RATING_GLOBAL)
    );

    // Ensure minRating is not greater than maxRating
    if (currentMin > currentMax) {
      if (type === "min") {
        // If min input caused min > max
        currentMin = currentMax;
      } else {
        // If max input caused min > max
        currentMax = currentMin;
      }
    }

    setLocalMinRating(currentMin);
    setLocalMaxRating(currentMax);
  };

  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const clearTags = () => {
    setFilters((prev) => ({ ...prev, tags: [] }));
  };

  return (
    // Using shadcn theme-aware classes for card background and borders
    <div className="space-y-6 p-4 rounded-md border bg-card border-border">
      {/* Rating Filter Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          {/* Using theme-aware text color from shadcn */}
          <h3 className="text-sm font-medium text-foreground">
            Problem Rating
          </h3>
          {/* Display colored rating values separately from inputs for better readability */}
          <div className="flex items-center gap-1 text-sm">
            <span className={`${getRatingClass(localMinRating)} font-medium`}>
              {localMinRating}
            </span>
            <span className="text-muted-foreground">-</span>
            <span className={`${getRatingClass(localMaxRating)} font-medium`}>
              {localMaxRating}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="number"
            id="min-rating-input"
            aria-label="Minimum rating"
            value={localMinRating} // Bind to local state directly
            onChange={(e) => handleRatingInputChange(e, "min")}
            onBlur={() => validateAndSetRatingOnBlur("min")}
            min={MIN_RATING_GLOBAL}
            max={MAX_RATING_GLOBAL}
            step={RATING_STEP}
            // Standard input styling (shadcn handles light/dark well)
            className="w-24 text-center"
          />
          <span className="text-muted-foreground hidden sm:inline">-</span>{" "}
          {/* Hide dash on very small screens if needed */}
          <Input
            type="number"
            id="max-rating-input"
            aria-label="Maximum rating"
            value={localMaxRating} // Bind to local state
            onChange={(e) => handleRatingInputChange(e, "max")}
            onBlur={() => validateAndSetRatingOnBlur("max")}
            min={MIN_RATING_GLOBAL}
            max={MAX_RATING_GLOBAL}
            step={RATING_STEP}
            className="w-24 text-center"
          />
        </div>

        <Slider
          id="rating-slider"
          min={MIN_RATING_GLOBAL}
          max={MAX_RATING_GLOBAL}
          step={RATING_STEP}
          value={[localMinRating, localMaxRating]}
          onValueChange={handleSliderChange}
          className="py-2" // Added padding for easier thumb interaction
          minStepsBetweenThumbs={0}
        />
      </div>

      {/* Tags Filter Section */}
      {availableTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-foreground">
              Problem Tags
            </h3>
            {filters.tags.length > 0 && (
              <button
                onClick={clearTags}
                // Use semantic destructive color from shadcn for better theme compatibility
                className="text-xs text-destructive hover:text-destructive/80 flex items-center"
                aria-label="Clear selected tags"
              >
                Clear tags <X className="h-3 w-3 ml-1" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {availableTags.map((tag) => {
              const isSelected = filters.tags.includes(tag);
              return (
                <Badge
                  key={tag}
                  // Let variant="default" handle primary styling if `code-purple` IS your primary.
                  // If not, "default" will use theme primary, and you override with classes.
                  variant={isSelected ? "default" : "outline"}
                  className={`
                    cursor-pointer transition-colors py-1 px-2.5 text-xs
                    ${
                      isSelected
                        ? // Assuming `code-purple` and `dark-purple` are custom colors.
                          // `text-primary-foreground` should contrast well with them.
                          "bg-code-purple text-primary-foreground hover:bg-code-purple/90 dark:bg-dark-purple dark:text-primary-foreground dark:hover:bg-dark-purple/90"
                        : // For outline, use the same brand colors or theme's accent/border
                          "border-code-purple/70 text-code-purple hover:bg-code-purple/10 dark:border-dark-purple/70 dark:text-dark-purple dark:hover:bg-dark-purple/20"
                    }
                  `}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemFilters;
