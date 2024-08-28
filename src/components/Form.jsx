import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { useEffect, useState } from "react";
import styles from "./Form.module.css";
import Button from "./Button";
import BackButton from "./BackButton";
import Message from "./Message";
import { useURLPosition } from "../hooks/useURLPosition";
import { flagEmojiToPNG, useCities } from "../contexts/CitiesContext";
import Spinner from "./Spinner";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

export function convertToEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());

  return String.fromCodePoint(...codePoints);
}

function Form() {
  const [lat, lng] = useURLPosition();
  const { createCity, isLoading } = useCities();
  const navigate = useNavigate();

  const [isGeolocationLoading, setIsGeolocationLoading] = useState(false);
  const [cityName, setCityName] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [emoji, setEmoji] = useState("");
  const [geoCodingError, setGeoCodingError] = useState("");
  const [countryCode, setCountryCode] = useState("");

  useEffect(
    function () {
      if (!lat && !lng) return;

      async function fetchData() {
        try {
          setIsGeolocationLoading(true);
          setGeoCodingError("");
          const res = await fetch(
            `${BASE_URL}?latitude=${lat}&longitude=${lng}`
          );
          const data = await res.json();
          data.city ? setCityName(data.city) : setCityName(data.locality);
          if (!data.countryCode)
            throw new Error(
              "That doesn't seem to be a city. Click somewhere else 😊"
            );
          setCountry(data.countryName);
          setCountryCode(data.countryCode);
          setEmoji(flagEmojiToPNG(convertToEmoji(data.countryCode)));
        } catch (error) {
          setGeoCodingError(error.message);
        } finally {
          setIsGeolocationLoading(false);
        }
      }
      fetchData();
    },
    [lat, lng]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cityName || !date) return;

    const newCity = {
      cityName,
      country,
      emoji: convertToEmoji(countryCode),
      date,
      notes,
      position: { lat, lng },
    };

    await createCity(newCity);
    navigate("/app/cities");
  }

  if (!lat && !lng)
    return (
      <Message message="Not the right way to select a city now, is it?😇😇😇 Please, start by click on the map" />
    );

  if (isGeolocationLoading) return <Spinner />;

  if (geoCodingError) return <Message message={geoCodingError} />;

  return (
    <form
      className={`${styles.form} ${isLoading ? styles.loading : ""}`}
      onSubmit={handleSubmit}
    >
      <div className={styles.row}>
        <label htmlFor="cityName">City name</label>
        <input id="cityName" readOnly value={cityName} />
        <span className={styles.flag}>{emoji}</span>
      </div>

      <div className={styles.row}>
        <label htmlFor="date">When did you go to {cityName}?</label>
        <DatePicker
          id="date"
          selected={date}
          onChange={(date) => setDate(date)}
          dateFormat={"dd/MM/yyyy"}
        />
      </div>

      <div className={styles.row}>
        <label htmlFor="notes">Notes about your trip to {cityName}</label>
        <textarea
          id="notes"
          onChange={(e) => setNotes(e.target.value)}
          value={notes}
        />
      </div>

      <div className={styles.buttons}>
        <Button type="primary">Add</Button>
        <BackButton />
      </div>
    </form>
  );
}

export default Form;
