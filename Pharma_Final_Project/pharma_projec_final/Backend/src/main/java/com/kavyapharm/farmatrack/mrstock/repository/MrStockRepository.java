package com.kavyapharm.farmatrack.mrstock.repository;

import com.kavyapharm.farmatrack.mrstock.model.MrStockItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MrStockRepository extends JpaRepository<MrStockItem, String> {
}
