package org.example.studyroomreservation.studyroom.reservation;

import org.example.studyroomreservation.studyroom.dto;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class RangeService {
    // TODO: complete this!!
    public Set<dto.Range> createAdjustedRanges(List<dto.Range> ranges, LocalTime startHour, LocalTime endHour) {
        return ranges.parallelStream()
                .map(
                        range -> range.adjust(startHour, endHour)
                ).filter(range -> range != null).collect(Collectors.toSet());
    }
}
