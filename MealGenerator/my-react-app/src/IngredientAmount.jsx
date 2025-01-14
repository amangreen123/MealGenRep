import React from "react";

const IngredientAmount = ({ ingredient }) => {
    return (
        <div>
            <p>{ingredient.amount} {ingredient.unit} {ingredient.name}</p>
        </div>
    );
}

export default IngredientAmount;