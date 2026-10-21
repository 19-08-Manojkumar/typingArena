import { Check, Lock } from "lucide-react";
import { ArenaArt } from "@/components/ArenaArt";
import type { Fighter } from "@/game/types/game.types";
export function CharacterCard({
  fighter,
  selected,
  onSelect,
  locked = false,
  actionLabel,
}: {
  fighter: Fighter;
  selected: boolean;
  onSelect: () => void;
  locked?: boolean;
  actionLabel?: string;
}) {
  return (
    <button
      className={`selection-card fighter-card ${fighter.faction} ${selected ? "selected" : ""}`}
      data-faction={fighter.faction}
      data-fighter={fighter.id}
      onClick={onSelect}
      disabled={locked}
      aria-pressed={selected}
    >
      <div className="selection-art" style={{ backgroundColor: `${fighter.color}12` }}>
        <ArenaArt mode="battle" color={fighter.color} variant={fighter.id} />
        <span className="selection-tag">
          {locked ? (
            <>
              <Lock size={12} /> LEVEL {fighter.unlockLevel}
            </>
          ) : (
            fighter.title
          )}
        </span>
        {selected && (
          <span className="selected-check">
            <Check size={16} />
          </span>
        )}
      </div>
      <div className="selection-copy">
        <h3>{fighter.name}</h3>
        <span className={`fighter-faction ${fighter.faction}`}>
          {fighter.faction.toUpperCase()} · {fighter.style}
        </span>
        <p>{fighter.description}</p>
        <div className="fighter-attributes">
          <span>
            HP <strong>{fighter.health}</strong>
          </span>
          <span>
            ENERGY <strong>{fighter.energy}</strong>
          </span>
          <span>
            SPEED <strong>{fighter.speed.toFixed(2)}×</strong>
          </span>
          <span>
            POWER <strong>{fighter.power.toFixed(2)}×</strong>
          </span>
        </div>
        <ul className="ability-list">
          {fighter.abilities.map((ability) => (
            <li key={ability.id}>
              <span>{ability.name}</span>
              <small>{ability.cost ? `${ability.cost} EN` : "FREE"}</small>
            </li>
          ))}
        </ul>
        {actionLabel && <span className="card-action">{actionLabel} →</span>}
      </div>
    </button>
  );
}
