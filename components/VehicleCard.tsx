import { Check, Lock } from "lucide-react";
import { ArenaArt } from "@/components/ArenaArt";
import type { Vehicle } from "@/game/types/game.types";
export function VehicleCard({
  vehicle,
  selected,
  locked,
  onSelect,
}: {
  vehicle: Vehicle;
  selected: boolean;
  locked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`selection-card vehicle-card ${selected ? "selected" : ""}`}
      disabled={locked}
      onClick={onSelect}
      aria-pressed={selected}
      style={{ "--vehicle-color": vehicle.color } as React.CSSProperties}
    >
      <div className="selection-art">
        <ArenaArt mode="racing" color={vehicle.color} variant={vehicle.id} />
        <span className="selection-tag">
          {locked ? (
            <>
              <Lock size={12} /> LEVEL {vehicle.unlockLevel}
            </>
          ) : (
            vehicle.className
          )}
        </span>
        {selected && (
          <span className="selected-check">
            <Check size={16} />
          </span>
        )}
      </div>
      <div className="selection-copy">
        <h3>{vehicle.name}</h3>
        <p>{vehicle.description}</p>
        <div className="attribute">
          <span>ACCELERATION</span>
          <div className="meter">
            <span style={{ width: `${(vehicle.acceleration / 1.3) * 100}%` }} />
          </div>
        </div>
        <div className="attribute">
          <span>HANDLING</span>
          <div className="meter">
            <span style={{ width: `${(vehicle.handling / 1.4) * 100}%` }} />
          </div>
        </div>
        <div className="attribute">
          <span>NITRO</span>
          <div className="meter">
            <span style={{ width: `${(vehicle.nitro / 1.4) * 100}%` }} />
          </div>
        </div>
      </div>
      <span className="vehicle-card-action">
        {locked ? `Unlock at level ${vehicle.unlockLevel}` : "Race with this ride →"}
      </span>
    </button>
  );
}
