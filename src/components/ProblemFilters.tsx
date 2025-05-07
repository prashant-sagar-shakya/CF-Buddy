import React, { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FilterOptions } from "@/types/codeforces";
import { X } from "lucide-react";

const MIN_RATING_GLOBAL = 800;
const MAX_RATING_GLOBAL = 3500;
const RATING_STEP = 100;
const DEFAULT_MIN_RATING = MIN_RATING_GLOBAL;
const DEFAULT_MAX_RATING = MAX_RATING_GLOBAL;
interface ProblemFiltersProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  availableTags: string[];
}
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
const getRatingClass = (rating: number | undefined): string => {
  if (rating === undefined || rating === null)
    return "text-gray-500 dark:text-gray-400";

  if (rating >= 3000) return "text-cf-legendary dark:text-cf-legendary-dark";
  if (rating >= 2600) return "text-cf-red dark:text-cf-red-dark";
  if (rating >= 2400) return "text-cf-red dark:text-cf-red-dark";
  if (rating >= 2300) return "text-cf-orange dark:text-cf-orange-dark";
  if (rating >= 2100) return "text-cf-orange dark:text-cf-orange-dark";
  if (rating >= 1900) return "text-cf-violet dark:text-cf-violet-dark";
  if (rating >= 1600) return "text-cf-blue dark:text-cf-blue-dark";
  if (rating >= 1400) return "text-cf-cyan dark:text-cf-cyan-dark";
  if (rating >= 1200) return "text-cf-green dark:text-cf-green-dark";
  return "text-cf-gray dark:text-cf-gray-dark";
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
    if (filters.minRating !== localMinRating) {
      setLocalMinRating(filters.minRating);
    }
    if (filters.maxRating !== localMaxRating) {
      setLocalMaxRating(filters.maxRating);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.minRating, filters.maxRating]);

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
      if (type === "min") setLocalMinRating(MIN_RATING_GLOBAL);
      else setLocalMaxRating(MAX_RATING_GLOBAL);
      return;
    }
    let newValue = parseInt(rawValue, 10);

    if (isNaN(newValue)) {
      return;
    }
    newValue = Math.max(
      MIN_RATING_GLOBAL,
      Math.min(newValue, MAX_RATING_GLOBAL)
    );

    if (type === "min") {
      setLocalMinRating(newValue);
    } else {
      setLocalMaxRating(newValue);
    }
  };

  const validateAndSetRatingOnBlur = (type: "min" | "max") => {
    let currentMin = Number(localMinRating);
    let currentMax = Number(localMaxRating);

    if (isNaN(currentMin)) currentMin = DEFAULT_MIN_RATING;
    if (isNaN(currentMax)) currentMax = DEFAULT_MAX_RATING;

    currentMin = Math.max(
      MIN_RATING_GLOBAL,
      Math.min(currentMin, MAX_RATING_GLOBAL)
    );
    currentMax = Math.max(
      MIN_RATING_GLOBAL,
      Math.min(currentMax, MAX_RATING_GLOBAL)
    );
    if (currentMin > currentMax) {
      if (type === "min") {
        currentMin = currentMax;
      } else {
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
    <div className="space-y-6 p-4 rounded-md border bg-card border-border">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-foreground">
            Problem Rating
          </h3>
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
            value={localMinRating}
            onChange={(e) => handleRatingInputChange(e, "min")}
            onBlur={() => validateAndSetRatingOnBlur("min")}
            min={MIN_RATING_GLOBAL}
            max={MAX_RATING_GLOBAL}
            step={RATING_STEP}
            className="w-24 text-center"
          />
          <span className="text-muted-foreground hidden sm:inline">-</span>{" "}
          <Input
            type="number"
            id="max-rating-input"
            aria-label="Maximum rating"
            value={localMaxRating}
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
          className="py-2"
          minStepsBetweenThumbs={0}
        />
      </div>

      {availableTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-foreground">
              Problem Tags
            </h3>
            {filters.tags.length > 0 && (
              <button
                onClick={clearTags}
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
                  variant={isSelected ? "default" : "outline"}
                  className={`
                    cursor-pointer transition-colors py-1 px-2.5 text-xs
                    ${
                      isSelected
                        ? "bg-code-purple text-primary-foreground hover:bg-code-purple/90 dark:bg-dark-purple dark:text-primary-foreground dark:hover:bg-dark-purple/90"
                        : "border-code-purple/70 text-code-purple hover:bg-code-purple/10 dark:border-dark-purple/70 dark:text-dark-purple dark:hover:bg-dark-purple/20"
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
