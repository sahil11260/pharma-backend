package com.kavyapharm.farmatrack.target.repository;

import com.kavyapharm.farmatrack.target.model.Target;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TargetRepository extends JpaRepository<Target, Long> {
}
