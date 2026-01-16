package com.kavyapharm.farmatrack.product.repository;

import com.kavyapharm.farmatrack.product.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}
