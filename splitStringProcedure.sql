DELIMITER //

CREATE PROCEDURE splitString(
  IN inputString text,
  IN delimiterChar CHAR(1)
)
BEGIN
  DROP TEMPORARY TABLE IF EXISTS temp_string;
  CREATE TEMPORARY TABLE temp_string(vals text); 
  WHILE LOCATE(delimiterChar,inputString) > 1 DO
    INSERT INTO temp_string 
      SELECT SUBSTRING_INDEX(inputString,delimiterChar,1);
    SET inputString = REGEXP_REPLACE(inputString, (
    	SELECT LEFT(inputString, LOCATE(delimiterChar, inputString))
    ),'',1,1);
  END WHILE;
  INSERT INTO temp_string(vals) VALUES(inputString);
  SELECT TRIM(vals) FROM temp_string;
END; //

DELIMITER ;